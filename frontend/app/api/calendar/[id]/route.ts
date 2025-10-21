import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  allDay: z.boolean().optional(),
  color: z.string().optional(),
  type: z.enum(['meeting', 'call', 'deadline', 'event', 'other']).optional(),
  attendeeIds: z.array(z.string()).optional(),
})

const updateAttendeeStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'declined', 'tentative']),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token || null)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
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
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if user has access
    const hasAccess =
      event.createdBy === user.id ||
      event.attendees.some((a) => a.userId === user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'No access to this event' }, { status: 403 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Get calendar event error:', error)
    return NextResponse.json(
      { error: 'Failed to get calendar event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token || null)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = updateEventSchema.parse(body)

    // Check if event exists and user is creator
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (existingEvent.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'Only event creator can update event' },
        { status: 403 }
      )
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.location !== undefined) updateData.location = data.location
    if (data.allDay !== undefined) updateData.allDay = data.allDay
    if (data.color !== undefined) updateData.color = data.color
    if (data.type !== undefined) updateData.type = data.type
    if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime)
    if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime)

    // Update attendees if provided
    if (data.attendeeIds !== undefined) {
      // Remove existing attendees
      await prisma.calendarAttendee.deleteMany({
        where: { eventId: params.id },
      })

      // Add new attendees
      if (data.attendeeIds.length > 0) {
        await prisma.calendarAttendee.createMany({
          data: data.attendeeIds.map((userId) => ({
            eventId: params.id,
            userId,
            status: 'pending',
          })),
        })
      }
    }

    const event = await prisma.calendarEvent.update({
      where: { id: params.id },
      data: updateData,
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
    console.error('Update calendar event error:', error)
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token || null)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = updateAttendeeStatusSchema.parse(body)

    // Check if user is an attendee
    const attendee = await prisma.calendarAttendee.findFirst({
      where: {
        eventId: params.id,
        userId: user.id,
      },
    })

    if (!attendee) {
      return NextResponse.json(
        { error: 'User is not an attendee of this event' },
        { status: 403 }
      )
    }

    await prisma.calendarAttendee.update({
      where: { id: attendee.id },
      data: { status: data.status },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update attendee status error:', error)
    return NextResponse.json(
      { error: 'Failed to update attendee status' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token || null)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if event exists and user is creator
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (existingEvent.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'Only event creator can delete event' },
        { status: 403 }
      )
    }

    await prisma.calendarEvent.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete calendar event error:', error)
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    )
  }
}
