import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { publishToSanity } from '@/lib/publishers'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    title, slug, competition, contentText, author,
    countryLeague, amateurGrade,
    homeTeam, awayTeam, homeScore, awayScore, matchDate, venue, round,
    asDraft,
  } = body

  if (!title)       return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!slug)        return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  if (!contentText) return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  if (!homeTeam)    return NextResponse.json({ error: 'Home team is required' }, { status: 400 })
  if (!awayTeam)    return NextResponse.json({ error: 'Away team is required' }, { status: 400 })
  if (!homeScore)   return NextResponse.json({ error: 'Home score is required' }, { status: 400 })
  if (!awayScore)   return NextResponse.json({ error: 'Away score is required' }, { status: 400 })
  if (!matchDate)   return NextResponse.json({ error: 'Match date is required' }, { status: 400 })

  const result = await publishToSanity({
    title,
    slug,
    competition: competition ?? 'AFL',
    contentText,
    author: author ?? 'SA Footballer',
    countryLeague,
    amateurGrade,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    matchDate,
    venue,
    round,
    asDraft,
  })

  if (result.success) {
    return NextResponse.json({ success: true, slug: result.result })
  }
  return NextResponse.json({ success: false, error: result.result }, { status: 500 })
}