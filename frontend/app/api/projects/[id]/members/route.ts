import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
})

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
})

// GET project members
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

    const projectId = params.id

    // Check if user has access to project
    const projectMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.id },
    })

    if (!projectMember) {
      return NextResponse.json(
        { error: 'No access to this project' },
        { status: 403 }
      )
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            jobTitle: true,
          },
        },
      },
      orderBy: { user: { name: 'asc' } },
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Get project members error:', error)
    return NextResponse.json(
      { error: 'Failed to get project members' },
      { status: 500 }
    )
  }
}

// POST - Add member to project
export async function POST(
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
    const data = addMemberSchema.parse(body)
    const projectId = params.id

    // Check if user is admin of project
    const requestingMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.id },
    })

    if (!requestingMember || requestingMember.role === 'viewer') {
      return NextResponse.json(
        { error: 'Only project admins can add members' },
        { status: 403 }
      )
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (!userToAdd) {
      return NextResponse.json(
        { error: 'User with this email not found' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: userToAdd.id },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this project' },
        { status: 400 }
      )
    }

    // Add user to project
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: userToAdd.id,
        role: data.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            jobTitle: true,
          },
        },
      },
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Add project member error:', error)
    return NextResponse.json(
      { error: 'Failed to add project member' },
      { status: 500 }
    )
  }
}

// PUT - Update member role
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
    const data = updateMemberSchema.parse(body)
    const { memberId } = body
    const projectId = params.id

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 })
    }

    // Check if user is admin of project
    const requestingMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.id },
    })

    if (!requestingMember || requestingMember.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only project admins can update member roles' },
        { status: 403 }
      )
    }

    const member = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role: data.role },
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
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Update project member error:', error)
    return NextResponse.json(
      { error: 'Failed to update project member' },
      { status: 500 }
    )
  }
}

// DELETE - Remove member from project
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

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')
    const projectId = params.id

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 })
    }

    // Check if user is admin of project
    const requestingMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.id },
    })

    if (!requestingMember || requestingMember.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only project admins can remove members' },
        { status: 403 }
      )
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove project member error:', error)
    return NextResponse.json(
      { error: 'Failed to remove project member' },
      { status: 500 }
    )
  }
}
