import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const createProjectSchema = z.object({
  teamId: z.string(),
  name: z.string().min(2),
  key: z.string().min(2).max(10),
  description: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token || null)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: {
        team: {
          OR: [
            { createdBy: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
      },
      include: {
        team: true,
        _count: {
          select: {
            boards: true,
            tasks: true,
            sprints: true,
          },
        },
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json(
      { error: 'Failed to get projects' },
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
    const { teamId, name, key, description } = createProjectSchema.parse(body)

    // Check team access
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'No permission to create project' },
        { status: 403 }
      )
    }

    const project = await prisma.project.create({
      data: {
        teamId,
        name,
        key: key.toUpperCase(),
        description,
        members: {
          create: {
            userId: user.id,
            role: 'admin',
          },
        },
      },
      include: {
        team: true,
      },
    })

    return NextResponse.json({ project })
  } catch (error: any) {
    console.error('Create project error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Project key already exists in this team' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
