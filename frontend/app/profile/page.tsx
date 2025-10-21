'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, Save } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

export default function ProfilePage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState({
    name: '',
    jobTitle: '',
    phone: '',
    telegram: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/')
      return
    }

    const u = JSON.parse(userData)
    setUser(u)
    setProfileData({
      name: u.name || '',
      jobTitle: u.jobTitle || '',
      phone: u.phone || '',
      telegram: u.telegram || '',
    })
    setLoading(false)
  }, [router])

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        alert('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
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
      <header className="bg-card border-b border-border px-8 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </button>
          </Link>
          <h1 className="text-2xl font-bold">{t('profile')}</h1>
        </div>
      </header>

      <main className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-lg border border-border p-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-primary-foreground hover:bg-primary/90">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Job Title</label>
                <input
                  type="text"
                  value={profileData.jobTitle}
                  onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                  placeholder="Software Developer"
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Telegram</label>
                <input
                  type="text"
                  value={profileData.telegram}
                  onChange={(e) => setProfileData({ ...profileData, telegram: e.target.value })}
                  placeholder="@username"
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md"
                >
                  <Save className="w-4 h-4" />
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
