import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const updateSprintSchema = z.object({
  name: z.string().min(1).optional(),
  goal: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(['planned', 'active', 'closed']).optional(),
})

// GET single sprint
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sprint = await prisma.sprint.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        project: {
          select: { id: true, name: true, key: true },
        },
      },
    })

    if (!sprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
    }

    // Check if user has access to the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: sprint.projectId,
        userId: user.id,
      },
    })

    if (!projectMember) {
      return NextResponse.json(
        { error: 'No access to this project' },
        { status: 403 }
      )
    }

    return NextResponse.json({ sprint })
  } catch (error) {
    console.error('Get sprint error:', error)
    return NextResponse.json(
      { error: 'Failed to get sprint' },
      { status: 500 }
    )
  }
}

// PUT update sprint
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = updateSprintSchema.parse(body)

    // Check if sprint exists
    const existingSprint = await prisma.sprint.findUnique({
      where: { id: params.id },
    })

    if (!existingSprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
    }

    // Check if user has access to the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: existingSprint.projectId,
        userId: user.id,
      },
    })

    if (!projectMember) {
      return NextResponse.json(
        { error: 'No access to this project' },
        { status: 403 }
      )
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.goal !== undefined) updateData.goal = data.goal
    if (data.status !== undefined) updateData.status = data.status
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null
    }

    const sprint = await prisma.sprint.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ sprint })
  } catch (error) {
    console.error('Update sprint error:', error)
    return NextResponse.json(
      { error: 'Failed to update sprint' },
      { status: 500 }
    )
  }
}

// PATCH - for status updates and task assignments
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, taskIds } = body

    // Check if sprint exists
    const existingSprint = await prisma.sprint.findUnique({
      where: { id: params.id },
    })

    if (!existingSprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
    }

    // Check if user has access to the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: existingSprint.projectId,
        userId: user.id,
      },
    })

    if (!projectMember) {
      return NextResponse.json(
        { error: 'No access to this project' },
        { status: 403 }
      )
    }

    if (action === 'start') {
      // Start sprint
      const sprint = await prisma.sprint.update({
        where: { id: params.id },
        data: { status: 'active' },
      })
      return NextResponse.json({ sprint })
    }

    if (action === 'complete') {
      // Complete sprint - move incomplete tasks back to backlog
      await prisma.task.updateMany({
        where: {
          sprintId: params.id,
          status: { not: 'done' },
        },
        data: { sprintId: null },
      })

      const sprint = await prisma.sprint.update({
        where: { id: params.id },
        data: { status: 'closed' },
      })
      return NextResponse.json({ sprint })
    }

    if (action === 'addTasks' && taskIds && Array.isArray(taskIds)) {
      // Add tasks to sprint
      await prisma.task.updateMany({
        where: {
          id: { in: taskIds },
          projectId: existingSprint.projectId,
        },
        data: { sprintId: params.id },
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'removeTasks' && taskIds && Array.isArray(taskIds)) {
      // Remove tasks from sprint
      await prisma.task.updateMany({
        where: {
          id: { in: taskIds },
          sprintId: params.id,
        },
        data: { sprintId: null },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Patch sprint error:', error)
    return NextResponse.json(
      { error: 'Failed to update sprint' },
      { status: 500 }
    )
  }
}

// DELETE sprint
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if sprint exists
    const existingSprint = await prisma.sprint.findUnique({
      where: { id: params.id },
    })

    if (!existingSprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
    }

    // Check if user has access to the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: existingSprint.projectId,
        userId: user.id,
      },
    })

    if (!projectMember) {
      return NextResponse.json(
        { error: 'No access to this project' },
        { status: 403 }
      )
    }

    // Move tasks back to backlog before deleting sprint
    await prisma.task.updateMany({
      where: { sprintId: params.id },
      data: { sprintId: null },
    })

    await prisma.sprint.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete sprint error:', error)
    return NextResponse.json(
      { error: 'Failed to delete sprint' },
      { status: 500 }
    )
  }
}
