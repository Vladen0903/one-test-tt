'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface Task {
  id: string
  title: string
  startDate: string | null
  dueDate: string | null
  progress: number
  priority: string
  assignee: { id: string; name: string } | null
  sprint: { id: string; name: string } | null
  epic: { id: string; title: string; color: string } | null
}

interface Project {
  id: string
  name: string
  key: string
}

export default function GanttPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month')

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchTasks()
    }
  }, [selectedProject])

  const fetchProjects = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
        if (data.projects && data.projects.length > 0) {
          setSelectedProject(data.projects[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/gantt?projectId=${selectedProject}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getTaskPosition = (task: Task) => {
    if (!task.startDate) return null

    const startDate = new Date(task.startDate)
    const endDate = task.dueDate ? new Date(task.dueDate) : startDate

    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const daysInMonth = getDaysInMonth()

    // Calculate position and width
    const daysDiff = Math.floor((startDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24))
    const duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

    const left = Math.max(0, (daysDiff / daysInMonth) * 100)
    const width = Math.min(100 - left, (duration / daysInMonth) * 100)

    return { left: `${left}%`, width: `${width}%` }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const priorityColors = {
    lowest: '#6B7280',
    low: '#3B82F6',
    medium: '#F59E0B',
    high: '#F97316',
    critical: '#EF4444',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-muted-foreground">{t('loading')}</div>
      </div>
    )
  }

  const daysInMonth = getDaysInMonth()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                {t('back')}
              </button>
            </Link>
            <h1 className="text-2xl font-bold">{t('gantt')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 bg-secondary border border-input rounded-md"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.key})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Timeline Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 hover:bg-secondary rounded-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-semibold min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 hover:bg-secondary rounded-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-md text-sm"
            >
              Today
            </button>
          </div>
        </div>

        {/* Gantt Chart */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="flex">
            {/* Task List */}
            <div className="w-80 border-r border-border flex-shrink-0">
              <div className="bg-secondary px-4 py-3 font-semibold border-b border-border">
                Tasks ({tasks.length})
              </div>
              <div className="divide-y divide-border">
                {tasks.map((task) => (
                  <div key={task.id} className="px-4 py-3 hover:bg-secondary/50">
                    <div className="font-medium text-sm mb-1 truncate">{task.title}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {task.assignee && (
                        <span className="truncate">{task.assignee.name}</span>
                      )}
                      {task.sprint && (
                        <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[10px]">
                          {task.sprint.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No tasks with dates in this project
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Timeline Header */}
                <div className="bg-secondary border-b border-border">
                  <div className="flex">
                    {days.map((day) => (
                      <div
                        key={day}
                        className="flex-1 min-w-[30px] px-1 py-3 text-center text-xs border-r border-border last:border-r-0"
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline Bars */}
                <div className="divide-y divide-border">
                  {tasks.map((task) => {
                    const position = getTaskPosition(task)
                    return (
                      <div key={task.id} className="relative h-[52px] hover:bg-secondary/30">
                        {position && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-6 rounded px-2 text-xs text-white flex items-center justify-between overflow-hidden"
                            style={{
                              left: position.left,
                              width: position.width,
                              backgroundColor: task.epic?.color || priorityColors[task.priority as keyof typeof priorityColors] || '#3B82F6',
                            }}
                          >
                            <span className="truncate flex-1">{task.title}</span>
                            {task.progress > 0 && (
                              <span className="ml-2 text-[10px]">{task.progress}%</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {tasks.length === 0 && (
                    <div className="h-[200px]"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: priorityColors.critical }}></div>
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: priorityColors.high }}></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: priorityColors.medium }}></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: priorityColors.low }}></div>
            <span>Low</span>
          </div>
        </div>
      </main>
    </div>
  )
}
