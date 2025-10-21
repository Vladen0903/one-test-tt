'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FolderKanban } from 'lucide-react'

interface Project {
  id: string
  name: string
  key: string
  description: string | null
  _count: {
    boards: number
    tasks: number
    sprints: number
  }
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

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
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
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
      <header className="bg-card border-b border-border px-8 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
          <h1 className="text-2xl font-bold">All Projects</h1>
        </div>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors block"
            >
              <div className="flex items-start justify-between mb-3">
                <FolderKanban className="w-8 h-8 text-primary" />
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-mono rounded">
                  {project.key}
                </span>
              </div>
              <h4 className="font-semibold text-lg mb-2">{project.name}</h4>
              {project.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{project._count.boards} boards</span>
                <span>{project._count.tasks} tasks</span>
                <span>{project._count.sprints} sprints</span>
              </div>
            </Link>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full text-center py-20">
              <FolderKanban className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Go to dashboard to create your first project
              </p>
              <Link href="/dashboard">
                <button className="px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md transition-colors">
                  Go to Dashboard
                </button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
