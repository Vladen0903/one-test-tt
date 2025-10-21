import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const createColumnSchema = z.object({
  boardId: z.string(),
  title: z.string().min(1),
  position: z.number(),
})

const updateColumnSchema = z.object({
  title: z.string().min(1).optional(),
  position: z.number().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = createColumnSchema.parse(body)

    const column = await prisma.column.create({
      data: {
        boardId: data.boardId,
        title: data.title,
        position: data.position,
      },
    })

    return NextResponse.json({ column })
  } catch (error) {
    console.error('Create column error:', error)
    return NextResponse.json(
      { error: 'Failed to create column' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { columnId, ...data } = body
    const updateData = updateColumnSchema.parse(data)

    const column = await prisma.column.update({
      where: { id: columnId },
      data: updateData,
    })

    return NextResponse.json({ column })
  } catch (error) {
    console.error('Update column error:', error)
    return NextResponse.json(
      { error: 'Failed to update column' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const columnId = searchParams.get('columnId')

    if (!columnId) {
      return NextResponse.json({ error: 'Column ID required' }, { status: 400 })
    }

    await prisma.column.delete({
      where: { id: columnId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete column error:', error)
    return NextResponse.json(
      { error: 'Failed to delete column' },
      { status: 500 }
    )
  }
}
