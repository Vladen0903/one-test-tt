'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, MoreVertical, Shield, User as UserIcon, Eye, X, Crown } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import EditUserModal from '@/components/EditUserModal'

interface TeamMember {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  jobTitle: string | null
  role: string
}

interface Project {
  id: string
  name: string
  key: string
  members?: Array<{
    id: string
    role: string
    user: TeamMember
  }>
}

export default function TeamPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [members, setMembers] = useState<Array<{ id: string; role: string; user: TeamMember }>>([])
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('member')

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchMembers()
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

  const fetchMembers = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/projects/${selectedProject}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/projects/${selectedProject}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newMemberEmail,
          role: newMemberRole,
        }),
      })

      if (res.ok) {
        setNewMemberEmail('')
        setNewMemberRole('member')
        setShowAddMember(false)
        fetchMembers()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add member')
      }
    } catch (error) {
      console.error('Failed to add member:', error)
      alert('Failed to add member')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member from the project?')) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/projects/${selectedProject}/members?memberId=${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        fetchMembers()
      }
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-orange-500" />
      case 'member':
        return <UserIcon className="w-4 h-4 text-blue-500" />
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-500" />
      default:
        return <UserIcon className="w-4 h-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-orange-500/20 text-orange-500'
      case 'member':
        return 'bg-blue-500/20 text-blue-500'
      case 'viewer':
        return 'bg-gray-500/20 text-gray-500'
      default:
        return 'bg-muted text-muted-foreground'
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
            <h1 className="text-2xl font-bold">Team Members</h1>
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
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          </div>
        </div>
      </header>

      <main className="p-8">
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-secondary font-semibold text-sm">
            <div className="col-span-5">Member</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-border">
            {members.map((member) => (
              <div key={member.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-secondary/50 transition-colors">
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{member.user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {member.user.jobTitle || 'Team Member'}
                    </div>
                  </div>
                </div>
                <div className="col-span-3 flex items-center text-sm text-muted-foreground">
                  {member.user.email}
                </div>
                <div className="col-span-2 flex items-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    {member.role}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <div className="px-6 py-12 text-center text-muted-foreground">
                No team members yet. Add members to get started!
              </div>
            )}
          </div>
        </div>

        {/* Role Information */}
        <div className="mt-6 bg-card rounded-lg border border-border p-6">
          <h3 className="font-semibold mb-4">Role Permissions</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Admin</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Full access to project settings, can add/remove members, manage all content
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserIcon className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Member</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Can create and edit tasks, boards, and participate in projects
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Viewer</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Read-only access, can view but not modify project content
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Add Team Member</h3>
              <button
                onClick={() => setShowAddMember(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  User must be registered in the system
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md"
                >
                  Add Member
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
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
