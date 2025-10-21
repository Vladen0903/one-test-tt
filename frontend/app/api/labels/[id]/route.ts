import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const updateLabelSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = updateLabelSchema.parse(body)

    // Check if label exists
    const existingLabel = await prisma.label.findUnique({
      where: { id: params.id },
    })

    if (!existingLabel) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    // Check project access
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: existingLabel.projectId,
        userId: user.id,
      },
    })

    if (!projectMember) {
      return NextResponse.json(
        { error: 'No access to this project' },
        { status: 403 }
      )
    }

    const label = await prisma.label.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ label })
  } catch (error) {
    console.error('Update label error:', error)
    return NextResponse.json(
      { error: 'Failed to update label' },
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
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if label exists
    const existingLabel = await prisma.label.findUnique({
      where: { id: params.id },
    })

    if (!existingLabel) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    // Check project access
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: existingLabel.projectId,
        userId: user.id,
      },
    })

    if (!projectMember) {
      return NextResponse.json(
        { error: 'No access to this project' },
        { status: 403 }
      )
    }

    await prisma.label.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete label error:', error)
    return NextResponse.json(
      { error: 'Failed to delete label' },
      { status: 500 }
    )
  }
}
