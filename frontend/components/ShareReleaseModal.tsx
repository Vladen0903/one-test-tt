'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface Board {
  id: string
  title: string
}

interface ShareReleaseModalProps {
  releaseId: string
  projectId: string
  onClose: () => void
  onUpdate: () => void
}

export default function ShareReleaseModal({ releaseId, projectId, onClose, onUpdate }: ShareReleaseModalProps) {
  const { t } = useLanguage()
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoards, setSelectedBoards] = useState<string[]>([])

  useEffect(() => {
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/boards?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setBoards(data.boards || [])
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error)
    }
  }

  const handleShare = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/releases/${releaseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'attachBoards',
          boardIds: selectedBoards,
        }),
      })

      if (res.ok) {
        onUpdate()
        onClose()
      }
    } catch (error) {
      console.error('Failed to share release:', error)
    }
  }

  const toggleBoard = (boardId: string) => {
    setSelectedBoards(prev =>
      prev.includes(boardId)
        ? prev.filter(id => id !== boardId)
        : [...prev, boardId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold">{t('shareRelease')}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">{t('attachBoards')}</p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {boards.map((board) => (
              <label key={board.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80">
                <input
                  type="checkbox"
                  checked={selectedBoards.includes(board.id)}
                  onChange={() => toggleBoard(board.id)}
                  className="w-4 h-4"
                />
                <span>{board.title}</span>
              </label>
            ))}
            {boards.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">{t('noData')}</div>
            )}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <button
              onClick={handleShare}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
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
