import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  columnId: z.string().optional(),
  priority: z.enum(['lowest', 'low', 'medium', 'high', 'critical']).optional(),
  status: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  position: z.number().optional(),
  sprintId: z.string().optional().nullable(),
  releaseId: z.string().optional().nullable(),
  storyPoints: z.number().optional().nullable(),
  labels: z.array(z.string()).optional(),
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

    const task = await prisma.task.findUnique({
      where: { id: params.id },
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
        subtasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        checklists: {
          include: {
            items: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Get task error:', error)
    return NextResponse.json(
      { error: 'Failed to get task' },
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
    const data = updateTaskSchema.parse(body)

    // Get existing task to check permissions
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check permissions: only admin, creator, or assignee can edit
    const isCreator = existingTask.createdBy === user.id
    const isAssignee = existingTask.assigneeId === user.id
    const isAdmin = user.role === 'admin' || existingTask.project.members.some(m => m.role === 'admin')

    if (!isCreator && !isAssignee && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this task' },
        { status: 403 }
      )
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.columnId !== undefined) updateData.columnId = data.columnId
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.status !== undefined) updateData.status = data.status
    if (data.position !== undefined) updateData.position = data.position
    if (data.assigneeId !== undefined) {
      updateData.assigneeId = data.assigneeId
      // Track who assigned the task
      if (data.assigneeId && data.assigneeId !== existingTask.assigneeId) {
        updateData.assignedBy = user.id
      }
    }
    if (data.sprintId !== undefined) updateData.sprintId = data.sprintId
    if (data.releaseId !== undefined) updateData.releaseId = data.releaseId
    if (data.storyPoints !== undefined) updateData.storyPoints = data.storyPoints
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    }
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null
    }

    // Handle labels if provided
    if (data.labels !== undefined) {
      // Remove existing labels
      await prisma.taskLabel.deleteMany({
        where: { taskId: params.id },
      })

      // Add new labels
      if (data.labels.length > 0) {
        await prisma.taskLabel.createMany({
          data: data.labels.map((labelId) => ({
            taskId: params.id,
            labelId,
          })),
        })
      }
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignee: {
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
      },
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
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

    await prisma.task.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Task deleted' })
  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
