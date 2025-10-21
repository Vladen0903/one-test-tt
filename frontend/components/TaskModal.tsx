'use client'

import { useEffect, useState } from 'react'
import { X, Trash2, Calendar, User, Flag, Tag, MessageSquare, Paperclip } from 'lucide-react'

interface TaskModalProps {
  taskId: string
  onClose: () => void
  onUpdate?: () => void
}

interface Task {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  dueDate: string | null
  storyPoints: number | null
  assignee: { id: string; name: string; email: string } | null
  creator: { id: string; name: string; email: string }
  labels: { id: string; label: { id: string; name: string; color: string } }[]
  comments: any[]
  attachments: any[]
  subtasks: any[]
  createdAt: string
  updatedAt: string
}

interface User {
  id: string
  name: string
  email: string
}

interface Label {
  id: string
  name: string
  color: string
}

export default function TaskModal({ taskId, onClose, onUpdate }: TaskModalProps) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [projectMembers, setProjectMembers] = useState<User[]>([])
  const [projectLabels, setProjectLabels] = useState<Label[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    fetchTask()
  }, [taskId])

  const fetchTask = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setTask(data.task)
        setEditData({
          title: data.task.title,
          description: data.task.description || '',
          priority: data.task.priority,
          status: data.task.status,
          dueDate: data.task.dueDate ? data.task.dueDate.split('T')[0] : '',
          assigneeId: data.task.assignee?.id || '',
          storyPoints: data.task.storyPoints || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    const token = localStorage.getItem('token')
    if (!token || !task) return

    try {
      const updatePayload: any = {}
      if (editData.title !== task.title) updatePayload.title = editData.title
      if (editData.description !== (task.description || '')) updatePayload.description = editData.description
      if (editData.priority !== task.priority) updatePayload.priority = editData.priority
      if (editData.status !== task.status) updatePayload.status = editData.status
      if (editData.assigneeId !== (task.assignee?.id || '')) {
        updatePayload.assigneeId = editData.assigneeId || null
      }
      if (editData.dueDate !== (task.dueDate ? task.dueDate.split('T')[0] : '')) {
        updatePayload.dueDate = editData.dueDate || null
      }
      if (editData.storyPoints !== (task.storyPoints || '')) {
        updatePayload.storyPoints = editData.storyPoints ? parseInt(editData.storyPoints) : null
      }

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      })

      if (res.ok) {
        await fetchTask()
        setIsEditing(false)
        onUpdate?.()
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        onUpdate?.()
        onClose()
      }
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card rounded-lg p-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!task) {
    return null
  }

  const priorityColors = {
    lowest: 'bg-gray-500/20 text-gray-500',
    low: 'bg-blue-500/20 text-blue-500',
    medium: 'bg-yellow-500/20 text-yellow-500',
    high: 'bg-orange-500/20 text-orange-500',
    critical: 'bg-red-500/20 text-red-500',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-card rounded-lg border border-border max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-input rounded-md text-lg font-semibold"
              />
            ) : (
              <h2 className="text-xl font-semibold">{task.title}</h2>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditData({
                      title: task.title,
                      description: task.description || '',
                      priority: task.priority,
                      status: task.status,
                      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
                      assigneeId: task.assignee?.id || '',
                      storyPoints: task.storyPoints || '',
                    })
                  }}
                  className="px-4 py-2 bg-secondary text-foreground rounded-md"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-secondary text-foreground rounded-md hover:bg-secondary/80"
              >
                Edit
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              {isEditing ? (
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md min-h-[120px]"
                  placeholder="Add a description..."
                />
              ) : (
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {task.description || 'No description'}
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments ({task.comments.length})
              </h3>
              <div className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="bg-secondary p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        {comment.author.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{comment.author.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm">{comment.body}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Attachments ({task.attachments.length})
              </h3>
              {task.attachments.length === 0 && (
                <div className="text-sm text-muted-foreground">No attachments</div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              {isEditing ? (
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              ) : (
                <div className="px-3 py-2 bg-secondary rounded-md capitalize">
                  {task.status.replace('_', ' ')}
                </div>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Priority
              </label>
              {isEditing ? (
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                >
                  <option value="lowest">Lowest</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              ) : (
                <div className={`px-3 py-2 rounded-md capitalize ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                  {task.priority}
                </div>
              )}
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Assignee
              </label>
              {isEditing ? (
                <select
                  value={editData.assigneeId}
                  onChange={(e) => setEditData({ ...editData, assigneeId: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                >
                  <option value="">Unassigned</option>
                  {/* Add project members here */}
                </select>
              ) : (
                <div className="px-3 py-2 bg-secondary rounded-md">
                  {task.assignee ? task.assignee.name : 'Unassigned'}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Due Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.dueDate}
                  onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                />
              ) : (
                <div className="px-3 py-2 bg-secondary rounded-md">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                </div>
              )}
            </div>

            {/* Story Points */}
            <div>
              <label className="block text-sm font-medium mb-2">Story Points</label>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.storyPoints}
                  onChange={(e) => setEditData({ ...editData, storyPoints: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  placeholder="0"
                />
              ) : (
                <div className="px-3 py-2 bg-secondary rounded-md">
                  {task.storyPoints || 'Not set'}
                </div>
              )}
            </div>

            {/* Labels */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {task.labels.map((tl) => (
                  <span
                    key={tl.id}
                    className="px-2 py-1 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: tl.label.color }}
                  >
                    {tl.label.name}
                  </span>
                ))}
                {task.labels.length === 0 && (
                  <div className="text-sm text-muted-foreground">No labels</div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
              <div>Created by {task.creator.name}</div>
              <div>Created {new Date(task.createdAt).toLocaleDateString()}</div>
              <div>Updated {new Date(task.updatedAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
