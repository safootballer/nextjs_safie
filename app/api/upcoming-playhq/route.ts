// nextjs_safie/app/api/upcoming-playhq/route.ts
// Serves synced PlayHQ fixtures from the database (via Prisma).
// The website fetches this cross-origin.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// CORS so the website (different domain) can fetch this
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const CATEGORY_PATTERNS: Record<string, string[]> = {
  afl:      ['AFL'],
  aflw:     ['AFLW'],
  sanfl:    ['SANFL', 'South Australia National Football League'],
  sanflw:   ['SANFLW'],
  amateurs: ['Adelaide Footy League', 'Adelaide Football League'],
  sawfl:    ['Women', 'SAWFL'],
  country:  [],
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const gradeId  = searchParams.get('gradeId')

  try {
    // Hide games that have already been played.
    // A match runs ~2.5 hours, so hide anything whose start time is more than 3 hours ago.
    const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000)
    let where: any = { match_date: { gte: cutoff } }

    if (gradeId) {
      where.grade_id = gradeId
    } else if (category && category !== 'all') {
      const patterns = CATEGORY_PATTERNS[category] ?? []
      if (patterns.length) {
        where.OR = patterns.map(p => ({
          competition: { contains: p, mode: 'insensitive' },
        }))
      }
    }

    const rows = await prisma.fixtures.findMany({
      where,
      orderBy: { match_date: 'asc' },
      take: 100,
      select: {
        match_id: true, match_date: true, home_team: true, away_team: true,
        venue: true, competition: true, grade_id: true, grade_name: true, round: true,
      },
    })

    return NextResponse.json(rows, { headers: CORS })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: CORS })
  }
}