import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'

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

    const board = await prisma.board.findUnique({
      where: { id: params.id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
        project: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Check access - board can be project-based, team-based, or personal
    if (board.project && board.project.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // TODO: Add team-based and personal board access checks

    return NextResponse.json({ board })
  } catch (error) {
    console.error('Get board error:', error)
    return NextResponse.json(
      { error: 'Failed to get board' },
      { status: 500 }
    )
  }
}
