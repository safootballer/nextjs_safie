import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchMatchFromPlayHQ, buildMatchKnowledge } from '@/lib/playhq'
import { PLAYHQ_TO_COUNTRY_LEAGUE } from '@/lib/constants'

// Country league slug to display name
const COUNTRY_LEAGUE_NAMES: Record<string, string> = {
  'adelaide-plains':   'Adelaide Plains Football League',
  'barossa':           'Barossa Light & Gawler Football League',
  'eastern-eyre':      'Eastern Eyre Football League',
  'far-north':         'Far North Football League',
  'great-flinders':    'Great Flinders Football League',
  'great-southern':    'Great Southern Football League',
  'hills-div1':        'Hills Football League SA',
  'hills-country':     'Hills Country Division Football League',
  'kangaroo-island':   'Kangaroo Island Football League',
  'knt':               'Kowree Naracoorte Tatiara Football League',
  'limestone-coast':   'Limestone Coast Football League',
  'murray-valley':     'Murray Valley Football League',
  'mid-south-eastern': 'Mid South Eastern Football League',
  'north-eastern':     'North Eastern Football League',
  'northern-areas':    'Northern Areas Football League',
  'port-lincoln':      'Port Lincoln Football League',
  'river-murray':      'River Murray Football League',
  'riverland':         'Riverland Football League',
  'southern':          'Southern Football League',
  'spencer-gulf':      'Spencer Gulf Football League',
  'western-eyre':      'Western Eyre Football League',
  'whyalla':           'Whyalla Football League',
  'yorke-peninsula':   'Yorke Peninsula Football League',
}

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

      // Determine the correct competition name for the AI context
      const detectedCompetition = link?.competition ?? match.competition
      const isCountryFootball   = detectedCompetition === 'Country Football'
      const detectedLeague      = PLAYHQ_TO_COUNTRY_LEAGUE[match.competition] ?? null

      // Build the display competition name for AI context
      let competitionLabel = detectedCompetition
      if (isCountryFootball) {
        // Use grade_name from link if available (contains actual league name from PlayHQ)
        if (link?.grade_name) {
          competitionLabel = link.grade_name
        } else if (detectedLeague && COUNTRY_LEAGUE_NAMES[detectedLeague]) {
          competitionLabel = COUNTRY_LEAGUE_NAMES[detectedLeague]
        }
      } else if (detectedCompetition === 'Amateur') {
        competitionLabel = 'Adelaide Footy League'
      } else if (detectedCompetition === "SAWFL Women's") {
        competitionLabel = "SA Women's Football League"
      } else if (detectedCompetition === 'SANFL') {
        const grade = link?.sanfl_grade
        if (grade === 'under-16') competitionLabel = 'SANFL Under 16'
        else if (grade === 'under-18') competitionLabel = 'SANFL Under 18'
        else competitionLabel = 'SANFL'
      }

      // Build knowledge with correct competition label
      const matchWithCorrectComp = { ...match, competition: competitionLabel }
      const knowledge = buildMatchKnowledge(matchWithCorrectComp as any)

      results.push({
        matchId: match.match_id,
        knowledge,
        meta: {
          homeTeam:              match.home_team,
          awayTeam:              match.away_team,
          date:                  match.date,
          venue:                 match.venue,
          competition:           detectedCompetition,
          homeScore:             match.final_score.home,
          awayScore:             match.final_score.away,
          margin:                Math.abs(match.final_score.home - match.final_score.away),
          detectedCountryLeague: detectedLeague,
          isCountryFootball,
          amateurGrade:          link?.amateur_grade ?? null,
          sanflGrade:            link?.sanfl_grade   ?? null,
        },
      })
    } catch (e: any) {
      errors.push(`${matchId}: ${e.message}`)
    }
  }

  return NextResponse.json({ results, errors, total: results.length })
}