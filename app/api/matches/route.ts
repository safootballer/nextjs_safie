import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const links = await prisma.matchLink.findMany({
    where: { is_active: 1 },
    orderBy: { date: 'desc' },
  })

  const grouped: Record<string, typeof links> = {}
  for (const link of links) {
    const comp = link.competition ?? 'Other'
    if (!grouped[comp]) grouped[comp] = []
    grouped[comp].push(link)
  }

  return NextResponse.json({ links, grouped, total: links.length })
}