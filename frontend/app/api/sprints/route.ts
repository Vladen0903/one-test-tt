import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const createSprintSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  goal: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ sprints })
  } catch (error) {
    console.error('Get sprints error:', error)
    return NextResponse.json(
      { error: 'Failed to get sprints' },
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
    const data = createSprintSchema.parse(body)

    // Check project access
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

    const sprint = await prisma.sprint.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        goal: data.goal,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: 'planned',
      },
    })

    return NextResponse.json({ sprint })
  } catch (error) {
    console.error('Create sprint error:', error)
    return NextResponse.json(
      { error: 'Failed to create sprint' },
      { status: 500 }
    )
  }
}
