import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    // Check project access
    const projectMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.id },
    })

    if (!projectMember) {
      return NextResponse.json(
        { error: 'No access to this project' },
        { status: 403 }
      )
    }

    // Get tasks with dates
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        OR: [
          { startDate: { not: null } },
          { dueDate: { not: null } },
        ],
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        sprint: {
          select: { id: true, name: true },
        },
        epic: {
          select: { id: true, title: true, color: true },
        },
        dependencies: {
          include: {
            successor: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Get gantt data error:', error)
    return NextResponse.json(
      { error: 'Failed to get gantt data' },
      { status: 500 }
    )
  }
}
