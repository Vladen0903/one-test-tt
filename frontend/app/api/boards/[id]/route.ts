import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'

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

    // Check access
    if (board.project.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ board })
  } catch (error) {
    console.error('Get board error:', error)
    return NextResponse.json(
      { error: 'Failed to get board' },
      { status: 500 }
    )
  }
}
