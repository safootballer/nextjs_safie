// safie-leagues/lib/syncFixtures.ts
// Syncs upcoming fixtures for all sync-enabled grades into the database.

import { fetchUpcomingFixturesForGrade, Fixture } from './playhq-fixtures'
// Adjust this import to your DB client (same one your ladder sync uses)
import { pool } from './db'  // <-- change to match your existing DB import

export interface SyncResult {
  name: string
  success: boolean
  message: string
  count?: number
}

export async function syncAllFixtures(): Promise<SyncResult[]> {
  // Get all grades to sync (same leagues table your ladder sync uses)
  const { rows: leagues } = await pool.query(
    `SELECT grade_id, grade_name FROM leagues WHERE sync_enabled = true`
  )

  const results: SyncResult[] = []

  for (const league of leagues) {
    try {
      const fixtures = await fetchUpcomingFixturesForGrade(league.grade_id)

      // Remove old fixtures for this grade, then insert fresh
      await pool.query(`DELETE FROM fixtures WHERE grade_id = $1`, [league.grade_id])

      for (const fx of fixtures) {
        await pool.query(
          `INSERT INTO fixtures
            (match_id, match_date, home_team, away_team, venue, competition, grade_id, grade_name, round, status, synced_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW())
           ON CONFLICT (match_id) DO UPDATE SET
             match_date = EXCLUDED.match_date,
             home_team  = EXCLUDED.home_team,
             away_team  = EXCLUDED.away_team,
             venue      = EXCLUDED.venue,
             round      = EXCLUDED.round,
             status     = EXCLUDED.status,
             synced_at  = NOW()`,
          [fx.match_id, fx.date, fx.home_team, fx.away_team, fx.venue,
           fx.competition, fx.grade_id, fx.grade_name, fx.round, fx.status]
        )
      }

      results.push({
        name: league.grade_name,
        success: true,
        message: `${fixtures.length} upcoming fixtures`,
        count: fixtures.length,
      })
    } catch (e: any) {
      results.push({ name: league.grade_name, success: false, message: e.message })
    }

    // Delay between grades to avoid PlayHQ rate limiting
    await new Promise(r => setTimeout(r, 400))
  }

  return results
}