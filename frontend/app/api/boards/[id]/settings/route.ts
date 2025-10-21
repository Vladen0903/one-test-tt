import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'

// GET board settings
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
      },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Check access
    if (board.projectId) {
      const projectMember = await prisma.projectMember.findFirst({
        where: {
          projectId: board.projectId,
          userId: user.id,
        },
      })

      if (!projectMember) {
        return NextResponse.json({ error: 'No access' }, { status: 403 })
      }
    } else if (board.teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: board.teamId,
          userId: user.id,
        },
      })

      if (!teamMember) {
        return NextResponse.json({ error: 'No access' }, { status: 403 })
      }
    } else if (board.createdBy !== user.id) {
      return NextResponse.json({ error: 'No access' }, { status: 403 })
    }

    return NextResponse.json({ settings: board })
  } catch (error) {
    console.error('Get board settings error:', error)
    return NextResponse.json(
      { error: 'Failed to get board settings' },
      { status: 500 }
    )
  }
}

// PATCH - Update board settings
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

    const board = await prisma.board.findUnique({
      where: { id: params.id },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Check if user is admin/creator
    let isAdmin = false

    if (board.projectId) {
      const projectMember = await prisma.projectMember.findFirst({
        where: {
          projectId: board.projectId,
          userId: user.id,
        },
      })

      if (!projectMember) {
        return NextResponse.json({ error: 'No access' }, { status: 403 })
      }

      isAdmin = projectMember.role === 'admin' || board.createdBy === user.id
    } else if (board.teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: board.teamId,
          userId: user.id,
        },
      })

      if (!teamMember) {
        return NextResponse.json({ error: 'No access' }, { status: 403 })
      }

      isAdmin = ['owner', 'admin'].includes(teamMember.role) || board.createdBy === user.id
    } else {
      isAdmin = board.createdBy === user.id
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can modify board settings' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { title, background } = body

    const updatedBoard = await prisma.board.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(background !== undefined && { background }),
      },
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    })

    return NextResponse.json({ board: updatedBoard })
  } catch (error) {
    console.error('Update board settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update board settings' },
      { status: 500 }
    )
  }
}
