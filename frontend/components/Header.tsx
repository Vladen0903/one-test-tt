'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, User as UserIcon, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface HeaderProps {
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string | null
    jobTitle?: string | null
  } | null
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  ]

  const currentLang = languages.find(l => l.code === language) || languages[0]

  return (
    <header className="bg-card border-b border-border px-8 py-3 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">{t('dashboard')}</h2>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.name}!</p>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm">{currentLang.flag} {currentLang.name}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          
          {showLanguageMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as any)
                    setShowLanguageMenu(false)
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg ${
                    language === lang.code ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-sm">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!setShowProfileMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">{user?.name}</div>
              <div className="text-xs text-muted-foreground">{user?.jobTitle || 'Member'}</div>
            </div>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-border">
                <div className="font-medium">{user?.name}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
              </div>
              
              <div className="py-2">
                <button
                  onClick={() => {
                    router.push('/profile')
                    setShowProfileMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="text-sm">{t('profile')}</span>
                </button>
                
                <button
                  onClick={() => {
                    router.push('/settings')
                    setShowProfileMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">{t('settings')}</span>
                </button>
              </div>

              <div className="border-t border-border p-2">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left hover:bg-destructive/10 text-destructive flex items-center gap-2 rounded-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">{t('logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
