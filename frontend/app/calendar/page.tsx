'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Clock, MapPin, Users, X, Video, Phone, Flag, Edit, Trash2, Box
} from 'lucide-react'
import DayTasksModal from '@/components/DayTasksModal'

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  location: string | null
  startTime: string
  endTime: string
  allDay: boolean
  color: string
  type: string
  creator: { id: string; name: string; email: string }
  attendees: Array<{
    id: string
    status: string
    user: { id: string; name: string; email: string }
  }>
  project?: { id: string; name: string; key: string }
  team?: { id: string; name: string }
}

interface Task {
  id: string
  title: string
  dueDate: string
  priority: string
}

interface Release {
  id: string
  name: string
  releaseDate: string
  status: string
}

interface Project {
  id: string
  name: string
  key: string
  members?: Array<{ user: { id: string; name: string; email: string } }>
}

export default function CalendarPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [releases, setReleases] = useState<Release[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDayTasksModal, setShowDayTasksModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    allDay: false,
    type: 'meeting',
    color: '#3B82F6',
    projectId: '',
    attendeeIds: [] as string[],
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [currentDate, selectedProject])

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
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const params = new URLSearchParams({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      })

      if (selectedProject !== 'all') {
        params.append('projectId', selectedProject)
      }

      // Fetch events
      const eventsRes = fetch(`/api/calendar?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Fetch tasks with due dates
      const tasksRes = selectedProject !== 'all'
        ? fetch(`/api/tasks?projectId=${selectedProject}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : null

      // Fetch releases
      const releasesRes = selectedProject !== 'all'
        ? fetch(`/api/releases?projectId=${selectedProject}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : null

      const [eventsData, tasksData, releasesData] = await Promise.all([
        eventsRes,
        tasksRes,
        releasesRes,
      ])

      if (eventsData.ok) {
        const data = await eventsData.json()
        setEvents(data.events || [])
      }

      if (tasksData && tasksData.ok) {
        const data = await tasksData.json()
        const tasksWithDates = (data.tasks || []).filter((t: any) => t.dueDate)
        setTasks(tasksWithDates)
      } else {
        setTasks([])
      }

      if (releasesData && releasesData.ok) {
        const data = await releasesData.json()
        const releasesWithDates = (data.releases || []).filter((r: any) => r.releaseDate)
        setReleases(releasesWithDates)
      } else {
        setReleases([])
      }
    } catch (error) {
      console.error('Failed to fetch calendar data:', error)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const startDateTime = newEvent.allDay
        ? new Date(newEvent.startDate).toISOString()
        : new Date(`${newEvent.startDate}T${newEvent.startTime}`).toISOString()
      
      const endDateTime = newEvent.allDay
        ? new Date(newEvent.endDate || newEvent.startDate).toISOString()
        : new Date(`${newEvent.endDate || newEvent.startDate}T${newEvent.endTime}`).toISOString()

      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newEvent,
          projectId: newEvent.projectId || undefined,
          startTime: startDateTime,
          endTime: endDateTime,
        }),
      })

      if (res.ok) {
        setNewEvent({
          title: '',
          description: '',
          location: '',
          startDate: '',
          startTime: '09:00',
          endDate: '',
          endTime: '10:00',
          allDay: false,
          type: 'meeting',
          color: '#3B82F6',
          projectId: '',
          attendeeIds: [],
        })
        setShowCreateModal(false)
        fetchEvents()
      }
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event?')) return
    
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/calendar/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setSelectedEvent(null)
        fetchEvents()
      }
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getEventsForDay = (date: Date | null) => {
    if (!date) return { events: [], tasks: [], releases: [] }
    
    const dayEvents = events.filter((event) => {
      const eventStart = new Date(event.startTime)
      return (
        eventStart.getDate() === date.getDate() &&
        eventStart.getMonth() === date.getMonth() &&
        eventStart.getFullYear() === date.getFullYear()
      )
    })

    const dayTasks = tasks.filter((task) => {
      const taskDate = new Date(task.dueDate)
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      )
    })

    const dayReleases = releases.filter((release) => {
      const releaseDate = new Date(release.releaseDate)
      return (
        releaseDate.getDate() === date.getDate() &&
        releaseDate.getMonth() === date.getMonth() &&
        releaseDate.getFullYear() === date.getFullYear()
      )
    })

    return { events: dayEvents, tasks: dayTasks, releases: dayReleases }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const eventTypeIcons = {
    meeting: Users,
    call: Phone,
    deadline: Flag,
    event: CalendarIcon,
    other: CalendarIcon,
  }

  const eventTypeColors = {
    meeting: '#3B82F6',
    call: '#10B981',
    deadline: '#EF4444',
    event: '#8B5CF6',
    other: '#6B7280',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const days = getDaysInMonth()

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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-6 h-6" />
              Calendar
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 bg-secondary border border-input rounded-md"
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md"
            >
              <Plus className="w-4 h-4" />
              New Event
            </button>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 hover:bg-secondary rounded-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-semibold min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 hover:bg-secondary rounded-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-md text-sm"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="px-4 py-3 text-center font-semibold text-sm bg-secondary"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              const dayData = getEventsForDay(date)
              const isToday = date && 
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear()

              const totalItems = dayData.events.length + dayData.tasks.length + dayData.releases.length

              return (
                <div
                  key={index}
                  onClick={() => {
                    if (date) {
                      setSelectedDate(date.toISOString().split('T')[0])
                      setShowDayTasksModal(true)
                    }
                  }}
                  className={`min-h-[120px] p-2 border-r border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors ${
                    !date ? 'bg-muted/20' : ''
                  } ${isToday ? 'bg-primary/5' : ''}`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-medium mb-2 ${
                        isToday ? 'text-primary' : ''
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {/* Events */}
                        {dayData.events.slice(0, 2).map((event) => {
                          const EventIcon = eventTypeIcons[event.type as keyof typeof eventTypeIcons]
                          return (
                            <div
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity text-white truncate"
                              style={{ backgroundColor: event.color }}
                            >
                              <div className="flex items-center gap-1">
                                <EventIcon className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{event.title}</span>
                              </div>
                            </div>
                          )
                        })}
                        
                        {/* Tasks */}
                        {dayData.tasks.slice(0, 3 - dayData.events.length).map((task) => (
                          <div
                            key={task.id}
                            className="text-xs p-1.5 rounded bg-orange-500/80 text-white truncate flex items-center gap-1"
                          >
                            <Flag className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{task.title}</span>
                          </div>
                        ))}

                        {/* Releases */}
                        {dayData.releases.slice(0, 3 - dayData.events.length - dayData.tasks.length).map((release) => (
                          <div
                            key={release.id}
                            className="text-xs p-1.5 rounded bg-green-500/80 text-white truncate flex items-center gap-1"
                          >
                            <Box className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{release.name}</span>
                          </div>
                        ))}

                        {totalItems > 3 && (
                          <div className="text-xs text-muted-foreground px-1.5">
                            +{totalItems - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Event</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Team Meeting"
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                >
                  <option value="meeting">Meeting</option>
                  <option value="call">Call</option>
                  <option value="deadline">Deadline</option>
                  <option value="event">Event</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time</label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                    disabled={newEvent.allDay}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                    disabled={newEvent.allDay}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={newEvent.allDay}
                  onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="allDay" className="text-sm">All day event</label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Meeting agenda, notes, etc."
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Meeting room, Zoom link, etc."
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Project (optional)</label>
                <select
                  value={newEvent.projectId}
                  onChange={(e) => setNewEvent({ ...newEvent, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-input rounded-md"
                >
                  <option value="">Personal Event</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-2">
                  {['#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewEvent({ ...newEvent, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newEvent.color === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md"
                >
                  Create Event
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-secondary text-foreground rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div 
              className="sticky top-0 px-6 py-4 flex items-center justify-between text-white"
              style={{ backgroundColor: selectedEvent.color }}
            >
              <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="p-2 hover:bg-white/20 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-white/20 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  {selectedEvent.allDay ? (
                    <div>All day event</div>
                  ) : (
                    <div>
                      {new Date(selectedEvent.startTime).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' - '}
                      {new Date(selectedEvent.endTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>{selectedEvent.location}</div>
                </div>
              )}

              {selectedEvent.description && (
                <div className="pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground mb-2">Description</div>
                  <div className="whitespace-pre-wrap">{selectedEvent.description}</div>
                </div>
              )}

              {selectedEvent.attendees.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Attendees ({selectedEvent.attendees.length})
                  </div>
                  <div className="space-y-2">
                    {selectedEvent.attendees.map((attendee) => (
                      <div key={attendee.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            {attendee.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{attendee.user.name}</div>
                            <div className="text-xs text-muted-foreground">{attendee.user.email}</div>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          attendee.status === 'accepted' ? 'bg-green-500/20 text-green-500' :
                          attendee.status === 'declined' ? 'bg-red-500/20 text-red-500' :
                          attendee.status === 'tentative' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {attendee.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                Created by {selectedEvent.creator.name}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day Tasks Modal */}
      {showDayTasksModal && selectedDate && (
        <DayTasksModal
          date={new Date(selectedDate)}
          onClose={() => setShowDayTasksModal(false)}
          onUpdate={() => setShowDayTasksModal(false)}
        />
      )}
    </div>
  )
}
