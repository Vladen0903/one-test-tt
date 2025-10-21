'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, Box, CheckCircle, Clock, AlertCircle, X, Share2 } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import ShareReleaseModal from '@/components/ShareReleaseModal'

interface Release {
  id: string
  name: string
  releaseDate: string | null
  startDate: string | null
  endDate: string | null
  status: string
  description: string | null
  _count?: { tasks: number }
}

interface Project {
  id: string
  name: string
  key: string
}

export default function ReleasesPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null)
  const [newRelease, setNewRelease] = useState({
    name: '',
    description: '',
    releaseDate: '',
    startDate: '',
    endDate: '',
    status: 'planned',
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchReleases()
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

  const fetchReleases = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/releases?projectId=${selectedProject}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setReleases(data.releases || [])
      }
    } catch (error) {
      console.error('Failed to fetch releases:', error)
    }
  }

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/releases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: selectedProject,
          ...newRelease,
        }),
      })

      if (res.ok) {
        setNewRelease({
          name: '',
          description: '',
          releaseDate: '',
          startDate: '',
          endDate: '',
          status: 'planned',
        })
        setShowCreateModal(false)
        fetchReleases()
      }
    } catch (error) {
      console.error('Failed to create release:', error)
    }
  }

  const handleDeleteRelease = async (releaseId: string) => {
    if (!confirm('Delete this release?')) return
    
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/releases/${releaseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        fetchReleases()
      }
    } catch (error) {
      console.error('Failed to delete release:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'released':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'on_track':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'delayed':
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      default:
        return <Box className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'released':
        return 'bg-green-500/20 text-green-500'
      case 'on_track':
        return 'bg-blue-500/20 text-blue-500'
      case 'delayed':
        return 'bg-orange-500/20 text-orange-500'
      default:
        return 'bg-gray-500/20 text-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-muted-foreground">{t('loading')}</div>
      </div>
    )
  }

  // Sort releases by date
  const sortedReleases = [...releases].sort((a, b) => {
    const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
    const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
    return dateB - dateA
  })

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
            <h1 className="text-2xl font-bold">{t('releases')}</h1>
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
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md"
            >
              <Plus className="w-4 h-4" />
              Create Release
            </button>
          </div>
        </div>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedReleases.map((release) => (
            <div key={release.id} className="bg-card rounded-lg border border-border p-6 hover:border-primary transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(release.status)}
                  <div>
                    <h3 className="font-semibold text-lg">{release.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getStatusColor(release.status)}`}>
                      {release.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedReleaseId(release.id)
                      setShowShareModal(true)
                    }}
                    className="text-muted-foreground hover:text-primary"
                    title={t('shareRelease')}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRelease(release.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {release.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {release.description}
                </p>
              )}

              <div className="space-y-2 text-sm">
                {release.releaseDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Release: {new Date(release.releaseDate).toLocaleDateString()}</span>
                  </div>
                )}
                {release.startDate && release.endDate && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(release.startDate).toLocaleDateString()} - {new Date(release.endDate).toLocaleDateString()}
                  </div>
                )}
                {release._count && (
                  <div className="text-xs text-muted-foreground mt-3">
                    {release._count.tasks} tasks
                  </div>
                )}
              </div>
            </div>
          ))}

          {releases.length === 0 && (
            <div className="col-span-full text-center py-20">
              <Box className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No releases yet</h3>
              <p className="text-muted-foreground mb-4">Create your first release to start tracking versions</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md"
              >
                Create Release
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Release Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Release</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRelease} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Release Name *</label>
                <input
                  type="text"
                  value={newRelease.name}
                  onChange={(e) => setNewRelease({ ...newRelease, name: e.target.value })}
                  placeholder="v1.0.0"
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newRelease.description}
                  onChange={(e) => setNewRelease({ ...newRelease, description: e.target.value })}
                  placeholder="What's new in this release?"
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Release Date</label>
                <input
                  type="date"
                  value={newRelease.releaseDate}
                  onChange={(e) => setNewRelease({ ...newRelease, releaseDate: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={newRelease.startDate}
                    onChange={(e) => setNewRelease({ ...newRelease, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={newRelease.endDate}
                    onChange={(e) => setNewRelease({ ...newRelease, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={newRelease.status}
                  onChange={(e) => setNewRelease({ ...newRelease, status: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                >
                  <option value="planned">Planned</option>
                  <option value="on_track">On Track</option>
                  <option value="delayed">Delayed</option>
                  <option value="released">Released</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md"
                >
                  Create Release
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-secondary text-foreground rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Release Modal */}
      {showShareModal && selectedReleaseId && (
        <ShareReleaseModal
          releaseId={selectedReleaseId}
          onClose={() => {
            setShowShareModal(false)
            setSelectedReleaseId(null)
            fetchReleases()
          }}
        />
      )}
    </div>
  )
}
