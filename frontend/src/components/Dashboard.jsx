import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PlusCircle, LogOut, Settings, LayoutDashboard, Trash2 } from 'lucide-react';

const Dashboard = ({ user, onLogout, api }) => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await api.get('/boards');
      setBoards(response.data);
    } catch (error) {
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/boards', newBoard);
      setBoards([...boards, response.data]);
      setNewBoard({ title: '', description: '' });
      setIsCreateDialogOpen(false);
      toast.success('Board created successfully!');
    } catch (error) {
      toast.error('Failed to create board');
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm('Are you sure you want to delete this board?')) return;
    
    try {
      await api.delete(`/boards/${boardId}`);
      setBoards(boards.filter(b => b.id !== boardId));
      toast.success('Board deleted successfully');
    } catch (error) {
      toast.error('Failed to delete board');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900" style={{fontFamily: 'Space Grotesk, sans-serif'}}>TaskFlow</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Hello, <strong>{user.username}</strong></span>
              {user.role === 'admin' && (
                <Button
                  data-testid="admin-panel-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              )}
              <Button data-testid="logout-btn" variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Boards</h2>
            <p className="text-gray-600 mt-1">Manage your projects and tasks</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-board-btn" className="shadow-md">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Board
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="create-board-dialog">
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
                <DialogDescription>Add a new board to organize your tasks</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateBoard} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="board-title">Board Title</Label>
                  <Input
                    id="board-title"
                    data-testid="board-title-input"
                    placeholder="My Project"
                    value={newBoard.title}
                    onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="board-description">Description (Optional)</Label>
                  <Textarea
                    id="board-description"
                    data-testid="board-description-input"
                    placeholder="Describe your board..."
                    value={newBoard.description}
                    onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="create-board-submit-btn">Create</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Loading boards...</div>
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20">
            <LayoutDashboard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No boards yet</h3>
            <p className="text-gray-600 mb-6">Create your first board to get started</p>
            <Button data-testid="create-first-board-btn" onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Your First Board
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="boards-grid">
            {boards.map((board) => (
              <Card
                key={board.id}
                data-testid={`board-card-${board.id}`}
                className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm group relative"
              >
                <CardHeader onClick={() => navigate(`/board/${board.id}`)}>
                  <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                    {board.title}
                  </CardTitle>
                  {board.description && (
                    <CardDescription className="line-clamp-2">{board.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {new Date(board.created_at).toLocaleDateString()}
                    </span>
                    {board.owner_id === user.id && (
                      <Button
                        data-testid={`delete-board-${board.id}`}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBoard(board.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
