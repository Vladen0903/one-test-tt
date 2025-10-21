'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function GanttPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-8 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
          <h1 className="text-2xl font-bold">Gantt Chart</h1>
        </div>
      </header>
      <main className="p-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Gantt Chart View</h2>
          <p className="text-muted-foreground mb-8">
            This feature is under development.
          </p>
        </div>
      </main>
    </div>
  )
}
