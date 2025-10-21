'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  LayoutDashboard,
  FolderKanban,
  Layout,
  ListTodo,
  Calendar,
  Users,
  Settings,
  Plus,
  LogOut,
} from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import Header from '@/components/Header'

interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  jobTitle: string | null
}

interface Team {
  id: string
  name: string
  _count: { projects: number }
}

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

export default function DashboardPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState<User | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newProject, setNewProject] = useState({
    teamId: '',
    name: '',
    key: '',
    description: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/')
      return
    }

    setUser(JSON.parse(userData))
    fetchData(token)
  }, [router])

  const fetchData = async (token: string) => {
    try {
      const [teamsRes, projectsRes] = await Promise.all([
        fetch('/api/teams', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/projects', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const teamsData = await teamsRes.json()
      const projectsData = await projectsRes.json()

      setTeams(teamsData.teams || [])
      setProjects(projectsData.projects || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newTeamName }),
      })

      if (res.ok) {
        setNewTeamName('')
        setShowCreateTeam(false)
        fetchData(token)
      }
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newProject),
      })

      if (res.ok) {
        setNewProject({ teamId: '', name: '', key: '', description: '' })
        setShowCreateProject(false)
        fetchData(token)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-[280px] bg-card border-r border-border fixed h-screen flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Image
              src="/technotraff-sign.jpg"
              alt="TechnoTraff"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-lg font-bold text-primary">TT-Manager</h1>
              <p className="text-xs text-muted-foreground">Project Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md bg-primary/10 text-primary"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">{t('dashboard')}</span>
          </Link>
          <Link
            href="/projects"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary text-foreground"
          >
            <FolderKanban className="w-5 h-5" />
            <span>{t('projects')}</span>
          </Link>
          <Link
            href="/boards"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary text-foreground"
          >
            <Layout className="w-5 h-5" />
            <span>{t('boards')}</span>
          </Link>
          <Link
            href="/backlog"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary text-foreground"
          >
            <ListTodo className="w-5 h-5" />
            <span>{t('backlog')}</span>
          </Link>
          <Link
            href="/calendar"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary text-foreground"
          >
            <Calendar className="w-5 h-5" />
            <span>{t('calendar')}</span>
          </Link>
          <Link
            href="/releases"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary text-foreground"
          >
            <Calendar className="w-5 h-5" />
            <span>{t('releases')}</span>
          </Link>
          <Link
            href="/team"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary text-foreground"
          >
            <Users className="w-5 h-5" />
            <span>{t('company')}</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary text-foreground"
          >
            <Settings className="w-5 h-5" />
            <span>{t('settings')}</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.jobTitle || 'Team Member'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-destructive/10 text-destructive text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[280px]">
        <header className="bg-card border-b border-border px-8 py-4">
          <h2 className="text-2xl font-bold">{t('dashboard')}</h2>
          <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
        </header>

        <div className="p-8">
          {/* Teams Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{t('myTeams')}</h3>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('createTeam')}
              </button>
            </div>

            {showCreateTeam && (
              <form onSubmit={handleCreateTeam} className="bg-card border border-border rounded-lg p-4 mb-4">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Team name"
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md mb-2"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateTeam(false)}
                    className="px-4 py-2 bg-secondary text-foreground rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer"
                >
                  <h4 className="font-semibold text-lg mb-2">{team.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {team._count.projects} project{team._count.projects !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
              {teams.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">
                  No teams yet. Create your first team to get started.
                </p>
              )}
            </div>
          </section>

          {/* Projects Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Projects</h3>
              <button
                onClick={() => setShowCreateProject(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md transition-colors"
                disabled={teams.length === 0}
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            </div>

            {showCreateProject && (
              <form onSubmit={handleCreateProject} className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3">
                <select
                  value={newProject.teamId}
                  onChange={(e) => setNewProject({ ...newProject, teamId: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  required
                >
                  <option value="">Select Team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Project name"
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  required
                />
                <input
                  type="text"
                  value={newProject.key}
                  onChange={(e) => setNewProject({ ...newProject, key: e.target.value.toUpperCase() })}
                  placeholder="Project key (e.g., TT)"
                  maxLength={10}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  required
                />
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateProject(false)}
                    className="px-4 py-2 bg-secondary text-foreground rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-lg">{project.name}</h4>
                    <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-mono rounded">
                      {project.key}
                    </span>
                  </div>
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
                <p className="text-muted-foreground col-span-full text-center py-8">
                  No projects yet. Create your first project to get started.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
