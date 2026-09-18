// lib/syncFixtures.ts
// Syncs upcoming fixtures for all grades (from gradeList) into the database via Prisma.

import { fetchUpcomingFixturesForGrade } from './playhq-fixtures'
import { GRADE_LIST } from './gradeList'
import { prisma } from '@/lib/prisma'

export interface SyncResult {
  name: string
  success: boolean
  message: string
  count?: number
}

export async function syncAllFixtures(): Promise<SyncResult[]> {
  const results: SyncResult[] = []

  for (const g of GRADE_LIST) {
    try {
      const fixtures = await fetchUpcomingFixturesForGrade(g.gradeId)

      // Remove old fixtures for this grade, then upsert fresh ones
      await prisma.fixtures.deleteMany({ where: { grade_id: g.gradeId } })

      for (const fx of fixtures) {
        await prisma.fixtures.upsert({
          where: { match_id: fx.match_id },
          update: {
            match_date: fx.date ? new Date(fx.date) : null,
            home_team:  fx.home_team,
            away_team:  fx.away_team,
            venue:      fx.venue,
            round:      fx.round,
            status:     fx.status,
            synced_at:  new Date(),
          },
          create: {
            match_id:    fx.match_id,
            match_date:  fx.date ? new Date(fx.date) : null,
            home_team:   fx.home_team,
            away_team:   fx.away_team,
            venue:       fx.venue,
            competition: fx.competition,
            grade_id:    fx.grade_id,
            grade_name:  fx.grade_name,
            round:       fx.round,
            status:      fx.status,
            synced_at:   new Date(),
          },
        })
      }

      results.push({
        name: g.grade,
        success: true,
        message: `${fixtures.length} upcoming fixtures`,
        count: fixtures.length,
      })
    } catch (e: any) {
      results.push({ name: g.grade, success: false, message: e.message })
    }

    // Delay between grades to avoid PlayHQ rate limiting
    await new Promise(r => setTimeout(r, 400))
  }

  return results
}