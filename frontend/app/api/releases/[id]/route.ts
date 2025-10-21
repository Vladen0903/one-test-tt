import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const attachBoardsSchema = z.object({
  boardIds: z.array(z.string()),
})

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
    const { action } = body

    if (action === 'attachBoards') {
      const data = attachBoardsSchema.parse(body)
      
      // Remove existing board attachments
      await prisma.releaseBoard.deleteMany({
        where: { releaseId: params.id },
      })

      // Add new attachments
      if (data.boardIds.length > 0) {
        await prisma.releaseBoard.createMany({
          data: data.boardIds.map((boardId) => ({
            releaseId: params.id,
            boardId,
          })),
        })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Patch release error:', error)
    return NextResponse.json(
      { error: 'Failed to update release' },
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

    // Check if release exists
    const existingRelease = await prisma.release.findUnique({
      where: { id: params.id },
    })

    if (!existingRelease) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 })
    }

    // Check if user has access to the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: existingRelease.projectId,
        userId: user.id,
      },
    })

    if (!projectMember) {
      return NextResponse.json(
        { error: 'No access to this project' },
        { status: 403 }
      )
    }

    // Remove release association from tasks before deleting
    await prisma.task.updateMany({
      where: { releaseId: params.id },
      data: { releaseId: null },
    })

    await prisma.release.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete release error:', error)
    return NextResponse.json(
      { error: 'Failed to delete release' },
      { status: 500 }
    )
  }
}
