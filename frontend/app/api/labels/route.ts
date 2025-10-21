import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const createLabelSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
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

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    // Check project access
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id,
      },
    })

    if (!projectMember) {
      return NextResponse.json(
        { error: 'No access to this project' },
        { status: 403 }
      )
    }

    const labels = await prisma.label.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ labels })
  } catch (error) {
    console.error('Get labels error:', error)
    return NextResponse.json(
      { error: 'Failed to get labels' },
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
    const data = createLabelSchema.parse(body)

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

    const label = await prisma.label.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        color: data.color,
      },
    })

    return NextResponse.json({ label })
  } catch (error) {
    console.error('Create label error:', error)
    return NextResponse.json(
      { error: 'Failed to create label' },
      { status: 500 }
    )
  }
}
