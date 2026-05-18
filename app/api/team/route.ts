import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const members = await prisma.teamMember.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(members)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, email, role } = await req.json() as {
    name: string
    email: string
    role: string
  }

  if (!name?.trim() || !email?.trim() || !role?.trim()) {
    return NextResponse.json({ error: 'name, email and role are required' }, { status: 400 })
  }

  try {
    const member = await prisma.teamMember.create({
      data: {
        userId: session.user.id,
        name:   name.trim(),
        email:  email.trim().toLowerCase(),
        role:   role.trim(),
      },
    })
    return NextResponse.json(member, { status: 201 })
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === 'P2002') {
      return NextResponse.json({ error: 'A team member with that email already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}
