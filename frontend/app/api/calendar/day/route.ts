import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token || null)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') // YYYY-MM-DD format

    if (!date) {
      return NextResponse.json({ error: 'Date required' }, { status: 400 })
    }

    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    // Get user's teams for access control
    const teams = await prisma.teamMember.findMany({
      where: { userId: user.id },
      select: { teamId: true },
    })
    const teamIds = teams.map((t) => t.teamId)

    // Get user's projects
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId: user.id },
        },
      },
      select: { id: true },
    })
    const projectIds = projects.map((p) => p.id)

    // Get calendar events for this day
    const events = await prisma.calendarEvent.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                AND: [
                  { startTime: { gte: startDate } },
                  { startTime: { lte: endDate } },
                ],
              },
              {
                AND: [
                  { endTime: { gte: startDate } },
                  { endTime: { lte: endDate } },
                ],
              },
              {
                AND: [
                  { startTime: { lte: startDate } },
                  { endTime: { gte: endDate } },
                ],
              },
            ],
          },
          {
            OR: [
              { createdBy: user.id },
              { projectId: { in: projectIds } },
              { teamId: { in: teamIds } },
              {
                attendees: {
                  some: { userId: user.id },
                },
              },
            ],
          },
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    // Get tasks due on this day or assigned to user for this day
    const tasks = await prisma.task.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                AND: [
                  { dueDate: { gte: startDate } },
                  { dueDate: { lte: endDate } },
                ],
              },
              {
                AND: [
                  { startDate: { gte: startDate } },
                  { startDate: { lte: endDate } },
                ],
              },
            ],
          },
          {
            OR: [
              { assigneeId: user.id },
              { creatorId: user.id },
              { projectId: { in: projectIds } },
            ],
          },
        ],
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    // Get releases on this day
    const releases = await prisma.release.findMany({
      where: {
        releaseDate: {
          gte: startDate,
          lte: endDate,
        },
        projectId: { in: projectIds },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { releaseDate: 'asc' },
    })

    return NextResponse.json({
      events,
      tasks,
      releases,
      date,
    })
  } catch (error) {
    console.error('Get day data error:', error)
    return NextResponse.json(
      { error: 'Failed to get day data' },
      { status: 500 }
    )
  }
}
