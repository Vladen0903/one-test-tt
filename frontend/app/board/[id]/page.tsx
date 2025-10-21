'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'link'
import { ArrowLeft, Plus, MoreVertical } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string | null
  priority: string
  dueDate: string | null
  assignee: { id: string; name: string } | null
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

export default function BoardPage() {
  const params = useParams()
  const router = useRouter()
  const [board, setBoard] = useState<Board | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [tasks, setTasks] = useState<Record<string, Task[]>>({})
  const [loading, setLoading] = useState(true)
  const [showCreateTask, setShowCreateTask] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({ title: '', description: '' })

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

        // Fetch tasks for each column
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

  if (loading) {
    return (
      <div className=\"min-h-screen flex items-center justify-center bg-background\">
        <div className=\"text-xl text-muted-foreground\">Loading...</div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className=\"min-h-screen flex items-center justify-center bg-background\">
        <div className=\"text-xl text-muted-foreground\">Board not found</div>
      </div>
    )
  }

  return (
    <div className=\"min-h-screen bg-background\">
      <header className=\"bg-card border-b border-border px-8 py-4 sticky top-0 z-10\">
        <div className=\"flex items-center gap-4\">
          <Link href={`/project/${board.projectId}`}>
            <button className=\"flex items-center gap-2 text-muted-foreground hover:text-foreground\">
              <ArrowLeft className=\"w-4 h-4\" />
              Back to Project
            </button>
          </Link>
          <h1 className=\"text-2xl font-bold\">{board.title}</h1>
        </div>
      </header>

      <main className=\"p-6 overflow-x-auto\">
        <div className=\"flex gap-4 min-h-[calc(100vh-200px)]\">
          {columns.map((column) => (
            <div key={column.id} className=\"flex-shrink-0 w-80\">
              <div className=\"bg-card rounded-lg border border-border p-4\">
                <div className=\"flex justify-between items-center mb-4\">
                  <h3 className=\"font-semibold text-lg\">{column.title}</h3>
                  <span className=\"text-xs text-muted-foreground\">
                    {tasks[column.id]?.length || 0}
                  </span>
                </div>

                <div className=\"space-y-2 mb-4\">
                  {(tasks[column.id] || []).map((task) => (
                    <div
                      key={task.id}
                      className=\"bg-secondary p-3 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer\"
                    >
                      <h4 className=\"font-medium mb-1\">{task.title}</h4>
                      {task.description && (
                        <p className=\"text-sm text-muted-foreground line-clamp-2 mb-2\">
                          {task.description}
                        </p>
                      )}
                      <div className=\"flex items-center justify-between text-xs text-muted-foreground\">
                        <span className={`px-2 py-1 rounded ${
                          task.priority === 'critical' ? 'bg-destructive/20 text-destructive' :
                          task.priority === 'high' ? 'bg-orange-500/20 text-orange-500' :
                          'bg-muted'
                        }`}>
                          {task.priority}
                        </span>
                        <div className=\"flex gap-2\">
                          {task._count.subtasks > 0 && (
                            <span>☑ {task._count.subtasks}</span>
                          )}
                          {task._count.comments > 0 && (
                            <span>💬 {task._count.comments}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {showCreateTask === column.id ? (
                  <form onSubmit={(e) => handleCreateTask(e, column.id)} className=\"space-y-2\">
                    <input
                      type=\"text\"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder=\"Task title\"
                      className=\"w-full px-3 py-2 bg-background border border-input rounded-md text-sm\"
                      required
                      autoFocus
                    />
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder=\"Description (optional)\"
                      className=\"w-full px-3 py-2 bg-background border border-input rounded-md text-sm\"
                      rows={2}
                    />
                    <div className=\"flex gap-2\">
                      <button
                        type=\"submit\"
                        className=\"px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm\"
                      >
                        Add
                      </button>
                      <button
                        type=\"button\"
                        onClick={() => setShowCreateTask(null)}
                        className=\"px-3 py-1.5 bg-secondary text-foreground rounded-md text-sm\"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowCreateTask(column.id)}
                    className=\"w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md border border-dashed border-border transition-colors\"
                  >
                    + Add Task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
