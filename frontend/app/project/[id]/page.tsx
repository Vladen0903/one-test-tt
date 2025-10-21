'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, LayoutDashboard } from 'lucide-react'

interface Board {
  id: string
  title: string
  background: string | null
  _count: { tasks: number }
}

interface Project {
  id: string
  name: string
  key: string
  description: string | null
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateBoard, setShowCreateBoard] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')

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
      const [projectRes, boardsRes] = await Promise.all([
        fetch(`/api/projects/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/boards?projectId=${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (projectRes.ok) {
        const projectData = await projectRes.json()
        setProject(projectData.project || projectData)
      }

      if (boardsRes.ok) {
        const boardsData = await boardsRes.json()
        setBoards(boardsData.boards || [])
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
        body: JSON.stringify({
          projectId: params.id,
          title: newBoardTitle,
        }),
      })

      if (res.ok) {
        setNewBoardTitle('')
        setShowCreateBoard(false)
        fetchData()
      }
    } catch (error) {
      console.error('Failed to create board:', error)
    }
  }

  if (loading) {
    return (
      <div className=\"min-h-screen flex items-center justify-center bg-background\">
        <div className=\"text-xl text-muted-foreground\">Loading...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className=\"min-h-screen flex items-center justify-center bg-background\">
        <div className=\"text-xl text-muted-foreground\">Project not found</div>
      </div>
    )
  }

  return (
    <div className=\"min-h-screen bg-background\">
      <header className=\"bg-card border-b border-border px-8 py-4 sticky top-0 z-10\">
        <div className=\"flex items-center justify-between\">
          <div className=\"flex items-center gap-4\">
            <Link href=\"/dashboard\">
              <button className=\"flex items-center gap-2 text-muted-foreground hover:text-foreground\">
                <ArrowLeft className=\"w-4 h-4\" />
                Back
              </button>
            </Link>
            <div>
              <div className=\"flex items-center gap-3\">
                <h1 className=\"text-2xl font-bold\">{project.name}</h1>
                <span className=\"px-2 py-1 bg-primary/20 text-primary text-xs font-mono rounded\">
                  {project.key}
                </span>
              </div>
              {project.description && (
                <p className=\"text-sm text-muted-foreground mt-1\">{project.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowCreateBoard(true)}
            className=\"flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md transition-colors\"
          >
            <Plus className=\"w-4 h-4\" />
            Create Board
          </button>
        </div>
      </header>

      <main className=\"p-8\">
        {showCreateBoard && (
          <div className=\"bg-card border border-border rounded-lg p-4 mb-6\">
            <form onSubmit={handleCreateBoard} className=\"flex gap-2\">
              <input
                type=\"text\"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder=\"Board title\"
                className=\"flex-1 px-3 py-2 bg-secondary border border-input rounded-md\"
                required
                autoFocus
              />
              <button
                type=\"submit\"
                className=\"px-4 py-2 bg-primary text-primary-foreground rounded-md\"
              >
                Create
              </button>
              <button
                type=\"button\"
                onClick={() => setShowCreateBoard(false)}
                className=\"px-4 py-2 bg-secondary text-foreground rounded-md\"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
          {boards.map((board) => (
            <Link key={board.id} href={`/board/${board.id}`}>
              <div className=\"bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer h-full\">
                <div className=\"flex items-start justify-between mb-4\">
                  <LayoutDashboard className=\"w-8 h-8 text-primary\" />
                  <span className=\"text-xs text-muted-foreground\">
                    {board._count.tasks} tasks
                  </span>
                </div>
                <h3 className=\"text-xl font-semibold mb-2\">{board.title}</h3>
                <p className=\"text-sm text-muted-foreground\">
                  Click to open board
                </p>
              </div>
            </Link>
          ))}

          {boards.length === 0 && !showCreateBoard && (
            <div className=\"col-span-full text-center py-20\">
              <LayoutDashboard className=\"w-16 h-16 text-muted-foreground mx-auto mb-4\" />
              <h3 className=\"text-xl font-medium text-foreground mb-2\">No boards yet</h3>
              <p className=\"text-muted-foreground mb-6\">
                Create your first board to start organizing tasks
              </p>
              <button
                onClick={() => setShowCreateBoard(true)}
                className=\"px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md transition-colors\"
              >
                Create First Board
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
