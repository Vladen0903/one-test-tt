import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const createEventSchema = z.object({
  projectId: z.string().optional(),
  teamId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  allDay: z.boolean().default(false),
  color: z.string().optional(),
  type: z.enum(['meeting', 'call', 'deadline', 'event', 'other']).default('meeting'),
  attendeeIds: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token || null)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const teamId = searchParams.get('teamId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    
    if (projectId) {
      where.projectId = projectId
    } else if (teamId) {
      where.teamId = teamId
    } else {
      // Get all events where user is creator or attendee
      where.OR = [
        { createdBy: user.id },
        { attendees: { some: { userId: user.id } } }
      ]
    }

    // Add date range filter
    if (startDate && endDate) {
      where.AND = [
        { startTime: { gte: new Date(startDate) } },
        { startTime: { lte: new Date(endDate) } }
      ]
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        project: {
          select: { id: true, name: true, key: true },
        },
        team: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Get calendar events error:', error)
    return NextResponse.json(
      { error: 'Failed to get calendar events' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token || null)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = createEventSchema.parse(body)

    // Validate access to project/team if specified
    if (data.projectId) {
      const projectMember = await prisma.projectMember.findFirst({
        where: { projectId: data.projectId, userId: user.id },
      })
      if (!projectMember) {
        return NextResponse.json(
          { error: 'No access to this project' },
          { status: 403 }
        )
      }
    } else if (data.teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: { teamId: data.teamId, userId: user.id },
      })
      if (!teamMember) {
        return NextResponse.json(
          { error: 'No access to this team' },
          { status: 403 }
        )
      }
    }

    const event = await prisma.calendarEvent.create({
      data: {
        projectId: data.projectId || null,
        teamId: data.teamId || null,
        title: data.title,
        description: data.description,
        location: data.location,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        allDay: data.allDay,
        color: data.color || '#3B82F6',
        type: data.type,
        createdBy: user.id,
        attendees: data.attendeeIds
          ? {
              create: data.attendeeIds.map((userId) => ({
                userId,
                status: 'pending',
              })),
            }
          : undefined,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Create calendar event error:', error)
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    )
  }
}
