'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Layout, X } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface Board {
  id: string
  title: string
  projectId: string | null
  project?: {
    id: string
    name: string
    key: string
  } | null
  _count?: {
    tasks: number
  }
}

interface Project {
  id: string
  name: string
  key: string
}

export default function BoardsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [boards, setBoards] = useState<Board[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBoard, setNewBoard] = useState({
    name: '',
    description: '',
    projectId: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    try {
      const [projectsRes, boardsRes] = await Promise.all([
        fetch('/api/projects', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/boards', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (projectsRes.ok) {
        const data = await projectsRes.json()
        setProjects(data.projects || [])
        if (data.projects && data.projects.length > 0) {
          setNewBoard((prev) => ({ ...prev, projectId: data.projects[0].id }))
        }
      }

      if (boardsRes.ok) {
        const data = await boardsRes.json()
        setBoards(data.boards || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newBoard),
      })

      if (res.ok) {
        setNewBoard({ name: '', description: '', projectId: projects[0]?.id || '' })
        setShowCreateModal(false)
        fetchData()
      }
    } catch (error) {
      console.error('Failed to create board:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-muted-foreground">{t('loading')}</div>
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
                {t('back')}
              </button>
            </Link>
            <h1 className="text-2xl font-bold">{t('boards')}</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md"
          >
            <Plus className="w-4 h-4" />
            {t('createBoard')}
          </button>
        </div>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Link key={board.id} href={`/board/${board.id}`}>
              <div className="bg-card rounded-lg border border-border p-6 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-start gap-3 mb-4">
                  <Layout className="w-6 h-6 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{board.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {board.project.name} ({board.project.key})
                    </p>
                  </div>
                </div>
                {board.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {board.description}
                  </p>
                )}
              </div>
            </Link>
          ))}

          {boards.length === 0 && (
            <div className="col-span-full text-center py-20">
              <Layout className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">{t('noProjectsYet')}</h3>
              <p className="text-muted-foreground mb-4">Create your first board to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md"
              >
                {t('createBoard')}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Board Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">{t('createBoard')}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBoard} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('boardName')} *</label>
                <input
                  type="text"
                  value={newBoard.name}
                  onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                  placeholder="Development Board"
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('description')}</label>
                <textarea
                  value={newBoard.description}
                  onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                  placeholder="Board description..."
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('projectName')} *</label>
                {projects.length > 0 ? (
                  <select
                    value={newBoard.projectId}
                    onChange={(e) => setNewBoard({ ...newBoard, projectId: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                    required
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.key})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-muted-foreground">No projects available</div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md"
                >
                  {t('create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-secondary text-foreground rounded-md"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
