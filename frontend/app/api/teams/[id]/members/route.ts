import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const addMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
  position: z.string().optional(),
  jobTitle: z.string().optional(),
  accessibleSections: z.array(z.string()).optional(),
  projectIds: z.array(z.string()).optional(),
})

// GET team members
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

    // Check if user is team member
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: params.id,
        userId: user.id,
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'No access to this team' }, { status: 403 })
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId: params.id },
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
      orderBy: { user: { name: 'asc' } },
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Get team members error:', error)
    return NextResponse.json(
      { error: 'Failed to get team members' },
      { status: 500 }
    )
  }
}

// POST - Add member to team (or create new user)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token || null)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: params.id,
        userId: user.id,
      },
    })

    if (!teamMember || !['owner', 'admin'].includes(teamMember.role)) {
      return NextResponse.json(
        { error: 'Only admins can add members' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      email,
      name,
      password,
      role,
      position,
      jobTitle,
      accessibleSections,
      projectIds,
    } = addMemberSchema.parse(body)

    // Check if user already exists
    let targetUser = await prisma.user.findUnique({
      where: { email },
    })

    // If user doesn't exist and we have password, create new user
    if (!targetUser) {
      if (!password || !name) {
        return NextResponse.json(
          { error: 'Name and password required to create new user' },
          { status: 400 }
        )
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      targetUser = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          jobTitle: jobTitle || position,
          assignedBy: user.id,
          accessibleSections: JSON.stringify(accessibleSections || []),
        },
      })
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: params.id,
        userId: targetUser.id,
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 400 }
      )
    }

    // Add to team
    const newMember = await prisma.teamMember.create({
      data: {
        teamId: params.id,
        userId: targetUser.id,
        role,
        position,
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

    // Add to projects if specified
    if (projectIds && projectIds.length > 0) {
      await prisma.projectMember.createMany({
        data: projectIds.map((projectId) => ({
          projectId,
          userId: targetUser!.id,
          role: role === 'viewer' ? 'viewer' : 'member',
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ member: newMember })
  } catch (error) {
    console.error('Add team member error:', error)
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    )
  }
}
