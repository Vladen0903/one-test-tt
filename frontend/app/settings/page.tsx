'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, User as UserIcon, Bell, Shield } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

export default function SettingsPage() {
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/')
      return
    }

    setUser(JSON.parse(userData))
    setLoading(false)
  }, [router])

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
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </button>
          </Link>
          <h1 className="text-2xl font-bold">{t('settings')}</h1>
        </div>
      </header>

      <main className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Language Settings */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">{t('language')}</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose your preferred language for the interface
              </p>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setLanguage('en')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    language === 'en'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-3xl mb-2">🇬🇧</div>
                  <div className="font-medium">English</div>
                </button>
                <button
                  onClick={() => setLanguage('ru')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    language === 'ru'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-3xl mb-2">🇷🇺</div>
                  <div className="font-medium">Русский</div>
                </button>
                <button
                  onClick={() => setLanguage('uk')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    language === 'uk'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-3xl mb-2">🇺🇦</div>
                  <div className="font-medium">Українська</div>
                </button>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <UserIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">{t('profile')}</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-lg">{user?.name}</div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                  {user?.jobTitle && (
                    <div className="text-sm text-muted-foreground">{user.jobTitle}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">{t('accountSettings')}</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <div className="font-medium">User ID</div>
                  <div className="text-sm text-muted-foreground">{user?.id}</div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <div className="font-medium">Account Created</div>
                  <div className="text-sm text-muted-foreground">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance (future) */}
          <div className="bg-card rounded-lg border border-border p-6 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">{t('appearance')}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Theme customization coming soon...
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
