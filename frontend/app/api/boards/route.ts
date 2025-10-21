import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const createBoardSchema = z.object({
  projectId: z.string().optional(),
  teamId: z.string().optional(),
  title: z.string().min(2),
  background: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (projectId) {
      // Get boards for specific project
      const boards = await prisma.board.findMany({
        where: { projectId },
        include: {
          columns: {
            orderBy: { position: 'asc' },
          },
          _count: {
            select: { tasks: true },
          },
        },
      })
      return NextResponse.json({ boards })
    } else {
      // Get all boards user has access to (both project-based and personal)
      const teams = await prisma.teamMember.findMany({
        where: { userId: user.id },
        select: { teamId: true },
      })
      const teamIds = teams.map((t) => t.teamId)

      const projects = await prisma.project.findMany({
        where: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
        select: { id: true },
      })
      const projectIds = projects.map((p) => p.id)

      const boards = await prisma.board.findMany({
        where: {
          OR: [
            { projectId: { in: projectIds } },
            { AND: [{ projectId: null }, { teamId: { in: teamIds } }] },
            { AND: [{ projectId: null }, { createdBy: user.id }] },
          ],
        },
        include: {
          project: {
            select: { id: true, name: true, key: true },
          },
          _count: {
            select: { tasks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ boards })
    }
  } catch (error) {
    console.error('Get boards error:', error)
    return NextResponse.json(
      { error: 'Failed to get boards' },
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
    const { projectId, teamId, title, background } = createBoardSchema.parse(body)

    // Check access: either project member, team member, or creating personal board
    if (projectId) {
      const projectMember = await prisma.projectMember.findFirst({
        where: {
          projectId,
          userId: user.id,
        },
      })

      if (!projectMember) {
        return NextResponse.json(
          { error: 'No access to this project' },
          { status: 403 }
        )
      }
    } else if (teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: user.id,
        },
      })

      if (!teamMember) {
        return NextResponse.json(
          { error: 'No access to this team' },
          { status: 403 }
        )
      }
    }

    const board = await prisma.board.create({
      data: {
        projectId: projectId || null,
        teamId: teamId || null,
        createdBy: user.id,
        title,
        background,
        columns: {
          create: [
            { title: 'To Do', position: 0 },
            { title: 'In Progress', position: 1000 },
            { title: 'Review', position: 2000 },
            { title: 'Done', position: 3000 },
          ],
        },
      },
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    })

    return NextResponse.json({ board })
  } catch (error) {
    console.error('Create board error:', error)
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 }
    )
  }
}
