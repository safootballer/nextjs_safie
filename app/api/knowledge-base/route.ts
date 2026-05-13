import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchMatchFromPlayHQ, buildMatchKnowledge } from '@/lib/playhq'
import { PLAYHQ_TO_COUNTRY_LEAGUE } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { matchIds } = await req.json()
  if (!matchIds?.length) return NextResponse.json({ error: 'No match IDs provided' }, { status: 400 })

  const results: { matchId: string; knowledge: string; meta: any }[] = []
  const errors: string[] = []

  for (const matchId of matchIds) {
    try {
      const match = await fetchMatchFromPlayHQ(matchId)

      // Fetch match link to get auto-detected competition + grade
      const link = await prisma.matchLink.findFirst({ where: { match_id: matchId } })

      // Save to DB if not exists
      const existing = await prisma.match.findUnique({ where: { match_id: match.match_id } })
      if (!existing) {
        await prisma.match.create({
          data: {
            match_id:         match.match_id,
            extracted_at:     new Date().toISOString(),
            date:             match.date,
            competition:      match.competition,
            venue:            match.venue,
            home_team:        match.home_team,
            away_team:        match.away_team,
            home_final_score: match.final_score.home,
            away_final_score: match.final_score.away,
            margin:           Math.abs(match.final_score.home - match.final_score.away),
            quarter_scores:   JSON.stringify(match.period_scores),
            lineups:          JSON.stringify(match.lineups),
            goal_scorers:     JSON.stringify(match.goal_scorers),
            best_players:     JSON.stringify(match.best_players),
          },
        })
      }

      const knowledge      = buildMatchKnowledge(match as any)
      const detectedLeague = PLAYHQ_TO_COUNTRY_LEAGUE[match.competition] ?? null

      // Use detected competition from match link if available
      const detectedCompetition = link?.competition ?? match.competition
      const isCountryFootball   = detectedCompetition === 'Country Football' || !!detectedLeague

      results.push({
        matchId: match.match_id,
        knowledge,
        meta: {
          homeTeam:             match.home_team,
          awayTeam:             match.away_team,
          date:                 match.date,
          venue:                match.venue,
          competition:          detectedCompetition,
          homeScore:            match.final_score.home,
          awayScore:            match.final_score.away,
          margin:               Math.abs(match.final_score.home - match.final_score.away),
          detectedCountryLeague: detectedLeague,
          isCountryFootball,
          // New — from auto-detection in safie-admin
          amateurGrade:         link?.amateur_grade ?? null,
          sanflGrade:           link?.sanfl_grade   ?? null,
        },
      })
    } catch (e: any) {
      errors.push(`${matchId}: ${e.message}`)
    }
  }

  return NextResponse.json({ results, errors, total: results.length })
}