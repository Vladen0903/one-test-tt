import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const createReleaseSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  releaseDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['planned', 'on_track', 'delayed', 'released']).default('planned'),
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

    const releases = await prisma.release.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { releaseDate: 'desc' },
    })

    return NextResponse.json({ releases })
  } catch (error) {
    console.error('Get releases error:', error)
    return NextResponse.json(
      { error: 'Failed to get releases' },
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
    const data = createReleaseSchema.parse(body)

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

    const release = await prisma.release.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status,
      },
    })

    return NextResponse.json({ release })
  } catch (error) {
    console.error('Create release error:', error)
    return NextResponse.json(
      { error: 'Failed to create release' },
      { status: 500 }
    )
  }
}
