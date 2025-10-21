'use client'

import { useState } from 'react'
import { X, Plus, Edit, Trash2 } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'

interface Column {
  id: string
  title: string
  position: number
}

interface ColumnsManagerProps {
  boardId: string
  columns: Column[]
  onClose: () => void
  onUpdate: () => void
}

export default function ColumnsManager({ boardId, columns, onClose, onUpdate }: ColumnsManagerProps) {
  const { t } = useLanguage()
  const [localColumns, setLocalColumns] = useState(columns)
  const [newColumnTitle, setNewColumnTitle] = useState('')

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          boardId,
          title: newColumnTitle,
          position: localColumns.length,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setLocalColumns([...localColumns, data.column])
        setNewColumnTitle('')
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to add column:', error)
    }
  }

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm('Delete this column? All tasks will remain but lose column assignment.')) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/columns?columnId=${columnId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setLocalColumns(localColumns.filter(c => c.id !== columnId))
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to delete column:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('manageColumns')}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Existing Columns */}
          <div className="space-y-2">
            {localColumns.map((column) => (
              <div key={column.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="font-medium">{column.title}</span>
                <button
                  onClick={() => handleDeleteColumn(column.id)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Column */}
          <div className="pt-4 border-t border-border">
            <label className="block text-sm font-medium mb-2">{t('addColumn')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder={t('columnTitle')}
                className="flex-1 px-3 py-2 bg-secondary border border-input rounded-md"
                onKeyPress={(e) => e.key === 'Enter' && handleAddColumn()}
              />
              <button
                onClick={handleAddColumn}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
