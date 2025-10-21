import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, PlusCircle, MoreVertical, Trash2, Calendar, BarChart3 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import GanttChart from '@/components/GanttChart';

const Board = ({ user, onLogout, api }) => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState({});
  const [loading, setLoading] = useState(true);
  const [showGantt, setShowGantt] = useState(false);
  
  const [newListTitle, setNewListTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  
  const [newCardData, setNewCardData] = useState({ listId: '', title: '', description: '', dueDate: '' });
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  useEffect(() => {
    fetchBoardData();
  }, [boardId]);

  const fetchBoardData = async () => {
    try {
      const [boardRes, listsRes, cardsRes] = await Promise.all([
        api.get(`/boards/${boardId}`),
        api.get(`/boards/${boardId}/lists`),
        api.get(`/boards/${boardId}/cards`)
      ]);
      
      setBoard(boardRes.data);
      setLists(listsRes.data);
      
      const cardsByList = {};
      cardsRes.data.forEach(card => {
        if (!cardsByList[card.list_id]) {
          cardsByList[card.list_id] = [];
        }
        cardsByList[card.list_id].push(card);
      });
      setCards(cardsByList);
    } catch (error) {
      toast.error('Failed to load board data');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    
    try {
      const response = await api.post('/lists', {
        board_id: boardId,
        title: newListTitle,
        position: lists.length
      });
      setLists([...lists, response.data]);
      setNewListTitle('');
      setIsAddingList(false);
      toast.success('List created!');
    } catch (error) {
      toast.error('Failed to create list');
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Delete this list and all its cards?')) return;
    
    try {
      await api.delete(`/lists/${listId}`);
      setLists(lists.filter(l => l.id !== listId));
      const newCards = { ...cards };
      delete newCards[listId];
      setCards(newCards);
      toast.success('List deleted');
    } catch (error) {
      toast.error('Failed to delete list');
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    
    try {
      const cardPayload = {
        list_id: newCardData.listId,
        title: newCardData.title,
        description: newCardData.description,
        position: cards[newCardData.listId]?.length || 0,
        due_date: newCardData.dueDate ? new Date(newCardData.dueDate).toISOString() : null
      };
      
      const response = await api.post('/cards', cardPayload);
      const newCards = { ...cards };
      if (!newCards[newCardData.listId]) {
        newCards[newCardData.listId] = [];
      }
      newCards[newCardData.listId].push(response.data);
      setCards(newCards);
      
      setNewCardData({ listId: '', title: '', description: '', dueDate: '' });
      setIsCardDialogOpen(false);
      toast.success('Card created!');
    } catch (error) {
      toast.error('Failed to create card');
    }
  };

  const handleUpdateCard = async (e) => {
    e.preventDefault();
    
    try {
      const updatePayload = {
        title: editingCard.title,
        description: editingCard.description,
        due_date: editingCard.due_date ? new Date(editingCard.due_date).toISOString() : null
      };
      
      await api.put(`/cards/${editingCard.id}`, updatePayload);
      
      const newCards = { ...cards };
      const listId = editingCard.list_id;
      const cardIndex = newCards[listId].findIndex(c => c.id === editingCard.id);
      if (cardIndex !== -1) {
        newCards[listId][cardIndex] = { ...editingCard };
        setCards(newCards);
      }
      
      setEditingCard(null);
      toast.success('Card updated!');
    } catch (error) {
      toast.error('Failed to update card');
    }
  };

  const handleDeleteCard = async (cardId, listId) => {
    if (!window.confirm('Delete this card?')) return;
    
    try {
      await api.delete(`/cards/${cardId}`);
      const newCards = { ...cards };
      newCards[listId] = newCards[listId].filter(c => c.id !== cardId);
      setCards(newCards);
      toast.success('Card deleted');
    } catch (error) {
      toast.error('Failed to delete card');
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, type } = result;
    
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'card') {
      const sourceListId = source.droppableId;
      const destListId = destination.droppableId;
      
      const newCards = { ...cards };
      const sourceCards = Array.from(newCards[sourceListId] || []);
      const [movedCard] = sourceCards.splice(source.index, 1);
      
      if (sourceListId === destListId) {
        sourceCards.splice(destination.index, 0, movedCard);
        newCards[sourceListId] = sourceCards;
      } else {
        const destCards = Array.from(newCards[destListId] || []);
        destCards.splice(destination.index, 0, movedCard);
        newCards[sourceListId] = sourceCards;
        newCards[destListId] = destCards;
        
        try {
          await api.put(`/cards/${movedCard.id}`, {
            list_id: destListId,
            position: destination.index
          });
        } catch (error) {
          toast.error('Failed to move card');
          return;
        }
      }
      
      setCards(newCards);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl font-medium text-gray-700">Loading board...</div>
      </div>
    );
  }

  const allCards = Object.values(cards).flat();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button data-testid="back-to-dashboard-btn" variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{board?.title}</h1>
                {board?.description && <p className="text-sm text-gray-600">{board.description}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                data-testid="toggle-gantt-btn"
                variant={showGantt ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowGantt(!showGantt)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {showGantt ? 'Hide' : 'Show'} Gantt Chart
              </Button>
              <span className="text-sm text-gray-600">{user.username}</span>
            </div>
          </div>
        </div>
      </nav>

      {showGantt && (
        <div className="bg-white border-b border-gray-200 p-6" data-testid="gantt-chart-container">
          <GanttChart cards={allCards} lists={lists} />
        </div>
      )}

      <div className="p-6 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex space-x-4 min-h-[calc(100vh-200px)]" data-testid="board-lists-container">
            {lists.map((list) => (
              <div key={list.id} className="flex-shrink-0 w-80" data-testid={`list-${list.id}`}>
                <Card className="h-full flex flex-col bg-white/90 backdrop-blur-sm shadow-md border-0">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{list.title}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button data-testid={`list-menu-${list.id}`} variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            data-testid={`add-card-to-list-${list.id}`}
                            onClick={() => {
                              setNewCardData({ ...newCardData, listId: list.id });
                              setIsCardDialogOpen(true);
                            }}
                          >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Add Card
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            data-testid={`delete-list-${list.id}`}
                            className="text-red-600"
                            onClick={() => handleDeleteList(list.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete List
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto">
                    <Droppable droppableId={list.id} type="card">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`space-y-2 min-h-[100px] ${snapshot.isDraggingOver ? 'bg-indigo-50 rounded-lg p-2' : ''}`}
                        >
                          {(cards[list.id] || []).map((card, index) => (
                            <Draggable key={card.id} draggableId={card.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  data-testid={`card-${card.id}`}
                                  className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
                                    snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-gray-900 flex-1">{card.title}</h4>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button data-testid={`card-menu-${card.id}`} variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          <MoreVertical className="w-3 h-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuItem data-testid={`edit-card-${card.id}`} onClick={() => setEditingCard(card)}>
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          data-testid={`delete-card-${card.id}`}
                                          className="text-red-600"
                                          onClick={() => handleDeleteCard(card.id, list.id)}
                                        >
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  {card.description && (
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{card.description}</p>
                                  )}
                                  {card.due_date && (
                                    <div className="flex items-center text-xs text-gray-500 mt-2">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {new Date(card.due_date).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              </div>
            ))}

            <div className="flex-shrink-0 w-80">
              {isAddingList ? (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md">
                  <CardContent className="pt-6">
                    <form onSubmit={handleAddList}>
                      <Input
                        data-testid="new-list-title-input"
                        placeholder="List title..."
                        value={newListTitle}
                        onChange={(e) => setNewListTitle(e.target.value)}
                        autoFocus
                        className="mb-2"
                      />
                      <div className="flex space-x-2">
                        <Button type="submit" data-testid="add-list-submit-btn" size="sm">Add</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingList(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  data-testid="add-list-btn"
                  variant="outline"
                  className="w-full bg-white/60 backdrop-blur-sm hover:bg-white/80 border-dashed"
                  onClick={() => setIsAddingList(true)}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add List
                </Button>
              )}
            </div>
          </div>
        </DragDropContext>
      </div>

      <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
        <DialogContent data-testid="add-card-dialog">
          <DialogHeader>
            <DialogTitle>Add New Card</DialogTitle>
            <DialogDescription>Create a new card in the list</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCard} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="card-title">Title</Label>
              <Input
                id="card-title"
                data-testid="card-title-input"
                placeholder="Card title"
                value={newCardData.title}
                onChange={(e) => setNewCardData({ ...newCardData, title: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="card-description">Description</Label>
              <Textarea
                id="card-description"
                data-testid="card-description-input"
                placeholder="Card description..."
                value={newCardData.description}
                onChange={(e) => setNewCardData({ ...newCardData, description: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="card-due-date">Due Date</Label>
              <Input
                id="card-due-date"
                data-testid="card-due-date-input"
                type="date"
                value={newCardData.dueDate}
                onChange={(e) => setNewCardData({ ...newCardData, dueDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsCardDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="add-card-submit-btn">Add Card</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {editingCard && (
        <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
          <DialogContent data-testid="edit-card-dialog">
            <DialogHeader>
              <DialogTitle>Edit Card</DialogTitle>
              <DialogDescription>Update card details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateCard} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-card-title">Title</Label>
                <Input
                  id="edit-card-title"
                  data-testid="edit-card-title-input"
                  value={editingCard.title}
                  onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-card-description">Description</Label>
                <Textarea
                  id="edit-card-description"
                  data-testid="edit-card-description-input"
                  value={editingCard.description || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-card-due-date">Due Date</Label>
                <Input
                  id="edit-card-due-date"
                  data-testid="edit-card-due-date-input"
                  type="date"
                  value={editingCard.due_date ? new Date(editingCard.due_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingCard({ ...editingCard, due_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditingCard(null)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="edit-card-submit-btn">Update</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Board;
