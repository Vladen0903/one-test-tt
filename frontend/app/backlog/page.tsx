'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, Play, X } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string | null
  priority: string
  storyPoints: number | null
  assignee: { id: string; name: string } | null
}

interface Sprint {
  id: string
  name: string
  startDate: string | null
  endDate: string | null
  status: string
  goal: string | null
}

interface Project {
  id: string
  name: string
  key: string
}

export default function BacklogPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateSprint, setShowCreateSprint] = useState(false)
  const [newSprint, setNewSprint] = useState({ name: '', goal: '', startDate: '', endDate: '' })

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchBacklogData()
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

  const fetchBacklogData = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const [tasksRes, sprintsRes] = await Promise.all([
        fetch(`/api/tasks?projectId=${selectedProject}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/sprints?projectId=${selectedProject}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        const backlogTasks = (tasksData.tasks || []).filter((t: Task) => !t.assignee)
        setTasks(backlogTasks)
      }

      if (sprintsRes.ok) {
        const sprintsData = await sprintsRes.json()
        setSprints(sprintsData.sprints || [])
      }
    } catch (error) {
      console.error('Failed to fetch backlog data:', error)
    }
  }

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/sprints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: selectedProject,
          ...newSprint,
        }),
      })

      if (res.ok) {
        setNewSprint({ name: '', goal: '', startDate: '', endDate: '' })
        setShowCreateSprint(false)
        fetchBacklogData()
      }
    } catch (error) {
      console.error('Failed to create sprint:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </Link>
            <h1 className="text-2xl font-bold">Backlog & Sprints</h1>
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
            <button
              onClick={() => setShowCreateSprint(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md"
            >
              <Plus className="w-4 h-4" />
              Create Sprint
            </button>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Sprints */}
        <div className="space-y-6 mb-8">
          {sprints.map((sprint) => (
            <div key={sprint.id} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{sprint.name}</h3>
                  {sprint.goal && (
                    <p className="text-sm text-muted-foreground mt-1">{sprint.goal}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    sprint.status === 'active' ? 'bg-primary/20 text-primary' :
                    sprint.status === 'closed' ? 'bg-muted text-muted-foreground' :
                    'bg-secondary text-foreground'
                  }`}>
                    {sprint.status}
                  </span>
                  {sprint.status === 'planned' && (
                    <button className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm">
                      <Play className="w-3 h-3" />
                      Start Sprint
                    </button>
                  )}
                </div>
              </div>
              {(sprint.startDate || sprint.endDate) && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {sprint.startDate && new Date(sprint.startDate).toLocaleDateString()}
                  {sprint.startDate && sprint.endDate && ' - '}
                  {sprint.endDate && new Date(sprint.endDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Backlog */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Backlog ({tasks.length} tasks)</h3>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-secondary p-4 rounded-lg border border-border hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {task.storyPoints && (
                      <span className="px-2 py-1 bg-muted rounded text-xs">
                        {task.storyPoints} SP
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${
                      task.priority === 'critical' ? 'bg-destructive/20 text-destructive' :
                      task.priority === 'high' ? 'bg-orange-500/20 text-orange-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No backlog tasks. Create tasks in your boards first.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Sprint Modal */}
      {showCreateSprint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Create Sprint</h3>
              <button
                onClick={() => setShowCreateSprint(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSprint} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sprint Name</label>
                <input
                  type="text"
                  value={newSprint.name}
                  onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                  placeholder="Sprint 1"
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Goal (optional)</label>
                <textarea
                  value={newSprint.goal}
                  onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                  placeholder="What should be achieved in this sprint?"
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={newSprint.startDate}
                    onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={newSprint.endDate}
                    onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md"
                >
                  Create Sprint
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateSprint(false)}
                  className="px-4 py-2 bg-secondary text-foreground rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
