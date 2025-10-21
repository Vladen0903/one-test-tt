'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface Project {
  id: string
  name: string
}

interface Board {
  id: string
  title: string
}

interface EditUserModalProps {
  userId: string
  projectId: string
  onClose: () => void
  onUpdate: () => void
}

export default function EditUserModal({ userId, projectId, onClose, onUpdate }: EditUserModalProps) {
  const { t } = useLanguage()
  const [userData, setUserData] = useState({
    role: 'member',
    jobTitle: '',
  })
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([projectId])

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

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
    }
  }

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // Update role in current project
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: userId,
          role: userData.role,
        }),
      })

      if (res.ok) {
        onUpdate()
        onClose()
      }
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('editUser')}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('role')}</label>
            <select
              value={userData.role}
              onChange={(e) => setUserData({ ...userData, role: e.target.value })}
              className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
            >
              <option value="viewer">{t('viewer')}</option>
              <option value="member">{t('member')}</option>
              <option value="admin">{t('admin')}</option>
            </select>
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Job Title</label>
            <input
              type="text"
              value={userData.jobTitle}
              onChange={(e) => setUserData({ ...userData, jobTitle: e.target.value })}
              placeholder="Software Developer"
              className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
            />
          </div>

          {/* Projects Access */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('selectProjects')}</label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {projects.map((project) => (
                <label key={project.id} className="flex items-center gap-3 p-2 bg-secondary rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes(project.id)}
                    onChange={() => toggleProject(project.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{project.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Save className="w-4 h-4" />
              {t('save')}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-secondary text-foreground rounded-md"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
