from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List as ListType, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = "your-secret-key-change-in-production-12345678900987654321"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    hashed_password: str
    role: str = "user"  # user or admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Board(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    owner_id: str
    members: ListType[str] = []  # User IDs
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BoardCreate(BaseModel):
    title: str
    description: Optional[str] = None

class BoardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    members: Optional[List[str]] = None

class List(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    board_id: str
    title: str
    position: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ListCreate(BaseModel):
    board_id: str
    title: str
    position: int

class ListUpdate(BaseModel):
    title: Optional[str] = None
    position: Optional[int] = None

class Card(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    list_id: str
    title: str
    description: Optional[str] = None
    position: int
    assigned_to: ListType[str] = []  # User IDs
    labels: ListType[str] = []
    due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CardCreate(BaseModel):
    list_id: str
    title: str
    description: Optional[str] = None
    position: int
    due_date: Optional[datetime] = None

class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    list_id: Optional[str] = None
    position: Optional[int] = None
    assigned_to: Optional[List[str]] = None
    labels: Optional[List[str]] = None
    due_date: Optional[datetime] = None


# ============= AUTH HELPERS =============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if this is the first user (make them admin)
    user_count = await db.users.count_documents({})
    role = "admin" if user_count == 0 else "user"
    
    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=role
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        created_at=user.created_at
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_doc)
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.id})
    
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        created_at=user.created_at if isinstance(user.created_at, datetime) else datetime.fromisoformat(user.created_at)
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at
    )


# ============= USER MANAGEMENT (ADMIN ONLY) =============

@api_router.get("/users", response_model=List[UserResponse])
async def get_all_users(current_user: User = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return [
        UserResponse(
            id=u["id"],
            username=u["username"],
            email=u["email"],
            role=u["role"],
            created_at=datetime.fromisoformat(u["created_at"]) if isinstance(u["created_at"], str) else u["created_at"]
        )
        for u in users
    ]

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_admin_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}


# ============= BOARD ENDPOINTS =============

@api_router.post("/boards", response_model=Board)
async def create_board(board_data: BoardCreate, current_user: User = Depends(get_current_user)):
    board = Board(
        title=board_data.title,
        description=board_data.description,
        owner_id=current_user.id,
        members=[current_user.id]
    )
    
    doc = board.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.boards.insert_one(doc)
    
    return board

@api_router.get("/boards", response_model=List[Board])
async def get_boards(current_user: User = Depends(get_current_user)):
    # Get boards where user is member or owner
    boards = await db.boards.find(
        {"$or": [{"owner_id": current_user.id}, {"members": current_user.id}]},
        {"_id": 0}
    ).to_list(1000)
    
    for board in boards:
        if isinstance(board['created_at'], str):
            board['created_at'] = datetime.fromisoformat(board['created_at'])
        if isinstance(board['updated_at'], str):
            board['updated_at'] = datetime.fromisoformat(board['updated_at'])
    
    return boards

@api_router.get("/boards/{board_id}", response_model=Board)
async def get_board(board_id: str, current_user: User = Depends(get_current_user)):
    board = await db.boards.find_one({"id": board_id}, {"_id": 0})
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Check access
    if current_user.id not in board['members'] and board['owner_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if isinstance(board['created_at'], str):
        board['created_at'] = datetime.fromisoformat(board['created_at'])
    if isinstance(board['updated_at'], str):
        board['updated_at'] = datetime.fromisoformat(board['updated_at'])
    
    return Board(**board)

@api_router.put("/boards/{board_id}", response_model=Board)
async def update_board(board_id: str, board_update: BoardUpdate, current_user: User = Depends(get_current_user)):
    board = await db.boards.find_one({"id": board_id}, {"_id": 0})
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Only owner can update
    if board['owner_id'] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only owner can update board")
    
    update_data = {k: v for k, v in board_update.model_dump().items() if v is not None}
    if update_data:
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.boards.update_one({"id": board_id}, {"$set": update_data})
    
    updated_board = await db.boards.find_one({"id": board_id}, {"_id": 0})
    if isinstance(updated_board['created_at'], str):
        updated_board['created_at'] = datetime.fromisoformat(updated_board['created_at'])
    if isinstance(updated_board['updated_at'], str):
        updated_board['updated_at'] = datetime.fromisoformat(updated_board['updated_at'])
    
    return Board(**updated_board)

@api_router.delete("/boards/{board_id}")
async def delete_board(board_id: str, current_user: User = Depends(get_current_user)):
    board = await db.boards.find_one({"id": board_id}, {"_id": 0})
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    if board['owner_id'] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only owner can delete board")
    
    # Delete all lists and cards
    await db.lists.delete_many({"board_id": board_id})
    await db.cards.delete_many({"board_id": board_id})
    await db.boards.delete_one({"id": board_id})
    
    return {"message": "Board deleted successfully"}


# ============= LIST ENDPOINTS =============

@api_router.post("/lists", response_model=List)
async def create_list(list_data: ListCreate, current_user: User = Depends(get_current_user)):
    # Check board access
    board = await db.boards.find_one({"id": list_data.board_id}, {"_id": 0})
    if not board or (current_user.id not in board['members'] and board['owner_id'] != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    new_list = List(
        board_id=list_data.board_id,
        title=list_data.title,
        position=list_data.position
    )
    
    doc = new_list.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.lists.insert_one(doc)
    
    return new_list

@api_router.get("/boards/{board_id}/lists", response_model=List[List])
async def get_lists(board_id: str, current_user: User = Depends(get_current_user)):
    # Check board access
    board = await db.boards.find_one({"id": board_id}, {"_id": 0})
    if not board or (current_user.id not in board['members'] and board['owner_id'] != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    lists = await db.lists.find({"board_id": board_id}, {"_id": 0}).sort("position", 1).to_list(1000)
    
    for lst in lists:
        if isinstance(lst['created_at'], str):
            lst['created_at'] = datetime.fromisoformat(lst['created_at'])
    
    return lists

@api_router.put("/lists/{list_id}", response_model=List)
async def update_list(list_id: str, list_update: ListUpdate, current_user: User = Depends(get_current_user)):
    existing_list = await db.lists.find_one({"id": list_id}, {"_id": 0})
    if not existing_list:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Check board access
    board = await db.boards.find_one({"id": existing_list['board_id']}, {"_id": 0})
    if not board or (current_user.id not in board['members'] and board['owner_id'] != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in list_update.model_dump().items() if v is not None}
    if update_data:
        await db.lists.update_one({"id": list_id}, {"$set": update_data})
    
    updated_list = await db.lists.find_one({"id": list_id}, {"_id": 0})
    if isinstance(updated_list['created_at'], str):
        updated_list['created_at'] = datetime.fromisoformat(updated_list['created_at'])
    
    return List(**updated_list)

@api_router.delete("/lists/{list_id}")
async def delete_list(list_id: str, current_user: User = Depends(get_current_user)):
    existing_list = await db.lists.find_one({"id": list_id}, {"_id": 0})
    if not existing_list:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Check board access
    board = await db.boards.find_one({"id": existing_list['board_id']}, {"_id": 0})
    if not board or (current_user.id not in board['members'] and board['owner_id'] != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete all cards in this list
    await db.cards.delete_many({"list_id": list_id})
    await db.lists.delete_one({"id": list_id})
    
    return {"message": "List deleted successfully"}


# ============= CARD ENDPOINTS =============

@api_router.post("/cards", response_model=Card)
async def create_card(card_data: CardCreate, current_user: User = Depends(get_current_user)):
    # Check list and board access
    existing_list = await db.lists.find_one({"id": card_data.list_id}, {"_id": 0})
    if not existing_list:
        raise HTTPException(status_code=404, detail="List not found")
    
    board = await db.boards.find_one({"id": existing_list['board_id']}, {"_id": 0})
    if not board or (current_user.id not in board['members'] and board['owner_id'] != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    card = Card(
        list_id=card_data.list_id,
        title=card_data.title,
        description=card_data.description,
        position=card_data.position,
        due_date=card_data.due_date
    )
    
    doc = card.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    if doc['due_date']:
        doc['due_date'] = doc['due_date'].isoformat()
    await db.cards.insert_one(doc)
    
    return card

@api_router.get("/lists/{list_id}/cards", response_model=List[Card])
async def get_cards(list_id: str, current_user: User = Depends(get_current_user)):
    # Check list and board access
    existing_list = await db.lists.find_one({"id": list_id}, {"_id": 0})
    if not existing_list:
        raise HTTPException(status_code=404, detail="List not found")
    
    board = await db.boards.find_one({"id": existing_list['board_id']}, {"_id": 0})
    if not board or (current_user.id not in board['members'] and board['owner_id'] != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    cards = await db.cards.find({"list_id": list_id}, {"_id": 0}).sort("position", 1).to_list(1000)
    
    for card in cards:
        if isinstance(card['created_at'], str):
            card['created_at'] = datetime.fromisoformat(card['created_at'])
        if isinstance(card['updated_at'], str):
            card['updated_at'] = datetime.fromisoformat(card['updated_at'])
        if card.get('due_date') and isinstance(card['due_date'], str):
            card['due_date'] = datetime.fromisoformat(card['due_date'])
    
    return cards

@api_router.get("/boards/{board_id}/cards", response_model=List[Card])
async def get_all_board_cards(board_id: str, current_user: User = Depends(get_current_user)):
    # Check board access
    board = await db.boards.find_one({"id": board_id}, {"_id": 0})
    if not board or (current_user.id not in board['members'] and board['owner_id'] != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all lists for this board
    lists = await db.lists.find({"board_id": board_id}, {"_id": 0}).to_list(1000)
    list_ids = [lst['id'] for lst in lists]
    
    # Get all cards for these lists
    cards = await db.cards.find({"list_id": {"$in": list_ids}}, {"_id": 0}).to_list(1000)
    
    for card in cards:
        if isinstance(card['created_at'], str):
            card['created_at'] = datetime.fromisoformat(card['created_at'])
        if isinstance(card['updated_at'], str):
            card['updated_at'] = datetime.fromisoformat(card['updated_at'])
        if card.get('due_date') and isinstance(card['due_date'], str):
            card['due_date'] = datetime.fromisoformat(card['due_date'])
    
    return cards

@api_router.put("/cards/{card_id}", response_model=Card)
async def update_card(card_id: str, card_update: CardUpdate, current_user: User = Depends(get_current_user)):
    card = await db.cards.find_one({"id": card_id}, {"_id": 0})
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Check board access
    existing_list = await db.lists.find_one({"id": card['list_id']}, {"_id": 0})
    board = await db.boards.find_one({"id": existing_list['board_id']}, {"_id": 0})
    if not board or (current_user.id not in board['members'] and board['owner_id'] != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in card_update.model_dump().items() if v is not None}
    if update_data:
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        if 'due_date' in update_data and update_data['due_date']:
            update_data['due_date'] = update_data['due_date'].isoformat()
        await db.cards.update_one({"id": card_id}, {"$set": update_data})
    
    updated_card = await db.cards.find_one({"id": card_id}, {"_id": 0})
    if isinstance(updated_card['created_at'], str):
        updated_card['created_at'] = datetime.fromisoformat(updated_card['created_at'])
    if isinstance(updated_card['updated_at'], str):
        updated_card['updated_at'] = datetime.fromisoformat(updated_card['updated_at'])
    if updated_card.get('due_date') and isinstance(updated_card['due_date'], str):
        updated_card['due_date'] = datetime.fromisoformat(updated_card['due_date'])
    
    return Card(**updated_card)

@api_router.delete("/cards/{card_id}")
async def delete_card(card_id: str, current_user: User = Depends(get_current_user)):
    card = await db.cards.find_one({"id": card_id}, {"_id": 0})
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Check board access
    existing_list = await db.lists.find_one({"id": card['list_id']}, {"_id": 0})
    board = await db.boards.find_one({"id": existing_list['board_id']}, {"_id": 0})
    if not board or (current_user.id not in board['members'] and board['owner_id'] != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.cards.delete_one({"id": card_id})
    
    return {"message": "Card deleted successfully"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
