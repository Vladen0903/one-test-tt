'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Edit, Trash2, Flag, Calendar as CalendarIcon } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface Task {
  id: string
  title: string
  priority: string
  dueDate: string
  assignee?: { id: string; name: string }
}

interface DayTasksModalProps {
  date: Date
  projectId?: string
  onClose: () => void
  onUpdate: () => void
}

export default function DayTasksModal({ date, projectId, onClose, onUpdate }: DayTasksModalProps) {
  const { t } = useLanguage()
  const [tasks, setTasks] = useState<Task[]>([])
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'medium',
  })

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const params = projectId ? `projectId=${projectId}` : ''
      const res = await fetch(`/api/tasks?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const filteredTasks = (data.tasks || []).filter((t: Task) => {
          if (!t.dueDate) return false
          const taskDate = new Date(t.dueDate)
          return (
            taskDate.getDate() === date.getDate() &&
            taskDate.getMonth() === date.getMonth() &&
            taskDate.getFullYear() === date.getFullYear()
          )
        })
        setTasks(filteredTasks)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !projectId) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          title: newTask.title,
          priority: newTask.priority,
          dueDate: date.toISOString(),
        }),
      })

      if (res.ok) {
        setNewTask({ title: '', priority: 'medium' })
        setShowCreateTask(false)
        fetchTasks()
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        fetchTasks()
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const priorityColors = {
    lowest: 'bg-gray-500/20 text-gray-500',
    low: 'bg-blue-500/20 text-blue-500',
    medium: 'bg-yellow-500/20 text-yellow-500',
    high: 'bg-orange-500/20 text-orange-500',
    critical: 'bg-red-500/20 text-red-500',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t('tasks')}</h3>
            <p className="text-sm text-muted-foreground">
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Task List */}
          <div className="space-y-2 mb-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80">
                <div className="flex items-center gap-3 flex-1">
                  <Flag className="w-4 h-4 text-orange-500" />
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    {task.assignee && (
                      <div className="text-xs text-muted-foreground">{task.assignee.name}</div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                    {task.priority}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="ml-2 p-2 text-destructive hover:bg-destructive/10 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {tasks.length === 0 && !showCreateTask && (
              <div className="text-center py-8 text-muted-foreground">{t('noData')}</div>
            )}
          </div>

          {/* Create Task Form */}
          {showCreateTask ? (
            <div className="p-4 bg-secondary rounded-lg space-y-3">
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder={t('title')}
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
                autoFocus
              />
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
              >
                <option value="lowest">{t('lowest')}</option>
                <option value="low">{t('low')}</option>
                <option value="medium">{t('medium')}</option>
                <option value="high">{t('high')}</option>
                <option value="critical">{t('critical')}</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTask}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md"
                >
                  {t('create')}
                </button>
                <button
                  onClick={() => setShowCreateTask(false)}
                  className="px-4 py-2 bg-background rounded-md"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateTask(true)}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('createTask')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
