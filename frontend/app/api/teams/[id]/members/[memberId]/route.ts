import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const updateMemberSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
  position: z.string().optional(),
  accessibleSections: z.array(z.string()).optional(),
  projectIds: z.array(z.string()).optional(),
})

// PATCH - Update team member
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token || null)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: params.id,
        userId: user.id,
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'No access to this team' }, { status: 403 })
    }

    const body = await req.json()
    const { role, position, accessibleSections, projectIds } = updateMemberSchema.parse(body)

    // Get target member
    const targetMember = await prisma.teamMember.findUnique({
      where: { id: params.memberId },
      include: { user: true },
    })

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Permission checks
    const isDirector = currentUser?.role === 'director'
    const isOwnerOrAdmin = ['owner', 'admin'].includes(teamMember.role)

    // Directors can modify admins, admins cannot
    if (targetMember.role === 'admin' && !isDirector) {
      return NextResponse.json(
        { error: 'Only directors can modify admin rights' },
        { status: 403 }
      )
    }

    // Only directors can assign admin role
    if (role === 'admin' && !isDirector) {
      return NextResponse.json(
        { error: 'Only directors can assign admin role' },
        { status: 403 }
      )
    }

    // Regular admins can modify members and viewers
    if (!isOwnerOrAdmin && !isDirector) {
      return NextResponse.json(
        { error: 'Only admins can modify team members' },
        { status: 403 }
      )
    }

    // Update team member
    const updatedMember = await prisma.teamMember.update({
      where: { id: params.memberId },
      data: {
        ...(role && { role }),
        ...(position !== undefined && { position }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            jobTitle: true,
            phone: true,
            telegram: true,
            role: true,
            accessibleSections: true,
          },
        },
      },
    })

    // Update user accessible sections if provided
    if (accessibleSections !== undefined) {
      await prisma.user.update({
        where: { id: targetMember.userId },
        data: {
          accessibleSections: JSON.stringify(accessibleSections),
        },
      })
    }

    // Update project memberships if provided
    if (projectIds !== undefined) {
      // Remove existing project memberships
      await prisma.projectMember.deleteMany({
        where: {
          userId: targetMember.userId,
          project: {
            teamId: params.id,
          },
        },
      })

      // Add new project memberships
      if (projectIds.length > 0) {
        await prisma.projectMember.createMany({
          data: projectIds.map((projectId) => ({
            projectId,
            userId: targetMember.userId,
            role: role === 'viewer' ? 'viewer' : 'member',
          })),
          skipDuplicates: true,
        })
      }
    }

    return NextResponse.json({ member: updatedMember })
  } catch (error) {
    console.error('Update team member error:', error)
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    )
  }
}

// DELETE - Remove team member
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token || null)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user permissions
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: params.id,
        userId: user.id,
      },
    })

    if (!teamMember || !['owner', 'admin'].includes(teamMember.role)) {
      return NextResponse.json(
        { error: 'Only admins can remove members' },
        { status: 403 }
      )
    }

    const targetMember = await prisma.teamMember.findUnique({
      where: { id: params.memberId },
    })

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Cannot remove owner
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove team owner' },
        { status: 400 }
      )
    }

    // Delete member
    await prisma.teamMember.delete({
      where: { id: params.memberId },
    })

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Remove team member error:', error)
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    )
  }
}
