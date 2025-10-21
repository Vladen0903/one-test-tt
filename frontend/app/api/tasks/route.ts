import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const createTaskSchema = z.object({
  projectId: z.string().optional(),
  boardId: z.string().optional(),
  columnId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['lowest', 'low', 'medium', 'high', 'critical']).default('medium'),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const boardId = searchParams.get('boardId')
    const columnId = searchParams.get('columnId')

    const where: any = {}
    if (projectId) where.projectId = projectId
    if (boardId) where.boardId = boardId
    if (columnId) where.columnId = columnId

    const tasks = await prisma.task.findMany({
      where,
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
        labels: {
          include: {
            label: true,
          },
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to get tasks' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = createTaskSchema.parse(body)

    // Check project access if projectId provided
    if (data.projectId) {
      const projectMember = await prisma.projectMember.findFirst({
        where: {
          projectId: data.projectId,
          userId: user.id,
        },
      })

      if (!projectMember) {
        return NextResponse.json(
          { error: 'No access to this project' },
          { status: 403 }
        )
      }
    }

    // Get max position for ordering
    const maxPosition = await prisma.task.findFirst({
      where: {
        columnId: data.columnId || null,
      },
      orderBy: { position: 'desc' },
    })

    const task = await prisma.task.create({
      data: {
        projectId: data.projectId || null,
        boardId: data.boardId || null,
        columnId: data.columnId || null,
        title: data.title,
        description: data.description,
        priority: data.priority,
        assigneeId: data.assigneeId || null,
        assignedBy: data.assigneeId ? user.id : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        creatorId: user.id,
        position: (maxPosition?.position || 0) + 1000,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
