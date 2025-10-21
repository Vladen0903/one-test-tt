'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TeamPage() {
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
          <h1 className="text-2xl font-bold">Team</h1>
        </div>
      </header>
      <main className="p-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Team Management</h2>
          <p className="text-muted-foreground mb-8">
            This feature is under development.
            <br />
            Here you will be able to manage team members and permissions.
          </p>
          <div className="bg-card border border-border rounded-lg p-8 max-w-2xl mx-auto text-left">
            <h3 className="font-semibold mb-4">Planned Features:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• View all team members</li>
              <li>• Invite new members</li>
              <li>• Assign roles and permissions</li>
              <li>• Remove members</li>
              <li>• Activity tracking</li>
              <li>• Workload visualization</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
