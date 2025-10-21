import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

const updateLanguageSchema = z.object({
  language: z.enum(['en', 'ru', 'uk']),
})

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getUserFromToken(token || null)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = updateLanguageSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { language: data.language },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        jobTitle: true,
        language: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Update language error:', error)
    return NextResponse.json(
      { error: 'Failed to update language' },
      { status: 500 }
    )
  }
}
