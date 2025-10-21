import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const createTeamSchema = z.object({
  name: z.string().min(2),
})

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { createdBy: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        members: {
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
        _count: {
          select: { projects: true },
        },
      },
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Get teams error:', error)
    return NextResponse.json(
      { error: 'Failed to get teams' },
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
    const { name } = createTeamSchema.parse(body)

    const team = await prisma.team.create({
      data: {
        name,
        createdBy: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
      include: {
        members: {
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
    })

    return NextResponse.json({ team })
  } catch (error) {
    console.error('Create team error:', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
