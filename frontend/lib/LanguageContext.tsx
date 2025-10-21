'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, TranslationKey } from './i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch user's language from server
    const fetchUserLanguage = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.user && data.user.language) {
            setLanguageState(data.user.language as Language)
          }
        }
      } catch (error) {
        console.error('Failed to fetch language:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserLanguage()
  }, [])

  const setLanguage = async (lang: Language) => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLanguageState(lang)
      return
    }

    try {
      const res = await fetch('/api/user/language', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language: lang }),
      })

      if (res.ok) {
        setLanguageState(lang)
        // Update user in localStorage
        const userData = localStorage.getItem('user')
        if (userData) {
          const user = JSON.parse(userData)
          user.language = lang
          localStorage.setItem('user', JSON.stringify(user))
        }
      }
    } catch (error) {
      console.error('Failed to update language:', error)
    }
  }

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key
  }

  if (loading) {
    return <div>{children}</div>
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    // Return default values if used outside provider
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: (key: TranslationKey) => key,
    }
  }
  return context
}
