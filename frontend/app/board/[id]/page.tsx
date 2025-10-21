'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { ArrowLeft, Plus, X, Trash2, Calendar, User } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string | null
  priority: string
  dueDate: string | null
  assignee: { id: string; name: string; email: string } | null
  _count: { subtasks: number; comments: number }
}

interface Column {
  id: string
  title: string
  position: number
}

interface Board {
  id: string
  title: string
  projectId: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function BoardPage() {
  const params = useParams()
  const router = useRouter()
  const [board, setBoard] = useState<Board | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [tasks, setTasks] = useState<Record<string, Task[]>>({})
  const [loading, setLoading] = useState(true)
  const [showCreateTask, setShowCreateTask] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({ title: '', description: '' })
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [projectMembers, setProjectMembers] = useState<User[]>([])

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    try {
      const boardRes = await fetch(`/api/boards/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (boardRes.ok) {
        const boardData = await boardRes.json()
        setBoard(boardData.board)
        setColumns(boardData.board.columns || [])

        // Fetch project members
        if (boardData.board.projectId) {
          const projectRes = await fetch(`/api/projects/${boardData.board.projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (projectRes.ok) {
            const projectData = await projectRes.json()
            setProjectMembers(projectData.project.members?.map((m: any) => m.user) || [])
          }
        }

        const tasksByColumn: Record<string, Task[]> = {}
        for (const column of boardData.board.columns || []) {
          const tasksRes = await fetch(
            `/api/tasks?projectId=${boardData.board.projectId}&columnId=${column.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json()
            tasksByColumn[column.id] = tasksData.tasks || []
          }
        }
        setTasks(tasksByColumn)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const token = localStorage.getItem('token')
    if (!token) return

    const sourceColumnId = source.droppableId
    const destColumnId = destination.droppableId

    const newTasks = { ...tasks }
    const sourceItems = Array.from(newTasks[sourceColumnId] || [])
    const [movedTask] = sourceItems.splice(source.index, 1)

    if (sourceColumnId === destColumnId) {
      sourceItems.splice(destination.index, 0, movedTask)
      newTasks[sourceColumnId] = sourceItems
    } else {
      const destItems = Array.from(newTasks[destColumnId] || [])
      destItems.splice(destination.index, 0, movedTask)
      newTasks[sourceColumnId] = sourceItems
      newTasks[destColumnId] = destItems

      try {
        await fetch(`/api/tasks/${draggableId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ columnId: destColumnId }),
        })
      } catch (error) {
        console.error('Failed to move task:', error)
        return
      }
    }

    setTasks(newTasks)
  }

  const handleCreateTask = async (e: React.FormEvent, columnId: string) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token || !board) return

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: board.projectId,
          boardId: board.id,
          columnId,
          title: newTask.title,
          description: newTask.description,
        }),
      })

      if (res.ok) {
        setNewTask({ title: '', description: '' })
        setShowCreateTask(null)
        fetchData()
      }
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleTaskClick = async (taskId: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedTask(data.task)
        setEditingTask({
          title: data.task.title,
          description: data.task.description || '',
          priority: data.task.priority,
          dueDate: data.task.dueDate ? new Date(data.task.dueDate).toISOString().split('T')[0] : '',
          assigneeId: data.task.assignee?.id || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch task:', error)
    }
  }

  const handleUpdateTask = async () => {
    if (!selectedTask) return
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          dueDate: editingTask.dueDate || null,
          assigneeId: editingTask.assigneeId || null,
        }),
      })

      if (res.ok) {
        setSelectedTask(null)
        setEditingTask(null)
        fetchData()
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDeleteTask = async () => {
    if (!selectedTask || !confirm('Delete this task?')) return
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setSelectedTask(null)
        fetchData()
      }
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-muted-foreground">Board not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href={`/project/${board.projectId}`}>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Project
            </button>
          </Link>
          <h1 className="text-2xl font-bold">{board.title}</h1>
        </div>
      </header>

      <main className="p-6 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-h-[calc(100vh-200px)]">
            {columns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">{column.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {tasks[column.id]?.length || 0}
                    </span>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-2 mb-4 min-h-[100px] transition-colors ${
                          snapshot.isDraggingOver ? 'bg-primary/5 rounded-lg p-2' : ''
                        }`}
                      >
                        {(tasks[column.id] || []).map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => handleTaskClick(task.id)}
                                className={`bg-secondary p-3 rounded-lg border border-border hover:border-primary transition-all cursor-pointer ${
                                  snapshot.isDragging ? 'shadow-lg rotate-2 opacity-90' : ''
                                }`}
                              >
                                <h4 className="font-medium mb-1">{task.title}</h4>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center justify-between">
                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                    task.priority === 'critical' ? 'bg-destructive/20 text-destructive' :
                                    task.priority === 'high' ? 'bg-orange-500/20 text-orange-500' :
                                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                    'bg-muted text-muted-foreground'
                                  }`}>
                                    {task.priority}
                                  </span>
                                  {task.assignee && (
                                    <span className="text-xs text-muted-foreground">
                                      {task.assignee.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {showCreateTask === column.id ? (
                    <form onSubmit={(e) => handleCreateTask(e, column.id)} className="space-y-2">
                      <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        placeholder="Task title"
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                        required
                        autoFocus
                      />
                      <textarea
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateTask(null)}
                          className="px-3 py-1.5 bg-secondary text-foreground rounded-md text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowCreateTask(column.id)}
                      className="w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md border border-dashed border-border transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Task
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      </main>

      {/* Task Detail Modal */}
      {selectedTask && editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Task Details</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  >
                    <option value="lowest">Lowest</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editingTask.dueDate}
                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Assignee
                </label>
                <select
                  value={editingTask.assigneeId}
                  onChange={(e) => setEditingTask({ ...editingTask, assigneeId: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <button
                  onClick={handleUpdateTask}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleDeleteTask}
                  className="px-4 py-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
