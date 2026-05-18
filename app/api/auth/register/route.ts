import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  const { name, email, password, companyName } = await req.json() as {
    name: string
    email: string
    password: string
    companyName: string
  }

  if (!name || !email || !password || !companyName) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  const hashed = await hash(password, 10)
  await prisma.user.create({
    data: { name, email, password: hashed, companyName },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
