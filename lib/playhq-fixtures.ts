// lib/playhq-fixtures.ts
// Fetches UPCOMING fixtures from PlayHQ.
// Flow: grade -> rounds -> fixtures per round -> keep UPCOMING games.

export const PLAYHQ_GRAPHQL_URL = 'https://api.playhq.com/graphql'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  'Content-Type': 'application/json',
  Origin: 'https://www.playhq.com',
  Referer: 'https://www.playhq.com/',
  tenant: 'afl',
}

const GRADE_ROUNDS_QUERY = `
query gradeRounds($gradeID: ID!) {
  discoverGrade(gradeID: $gradeID) {
    id
    name
    season { competition { name } }
    rounds { id name current number isFinalsRound }
  }
}
`

const FIXTURE_BY_ROUND_QUERY = `
query discoverFixtureByRound($roundID: ID!) {
  discoverFixtureByRound(roundID: $roundID) {
    games {
      id
      date
      allocation { time court { venue { name } } }
      home { ... on DiscoverTeam { name } }
      away { ... on DiscoverTeam { name } }
      status { value }
    }
  }
}
`

export function cleanTeamName(name: string): string {
  if (!name) return ''
  return name.replace(/\s*[-–].*$/, '').trim()
}

async function safePost(query: string, variables: Record<string, unknown>, retries = 2): Promise<any> {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await fetch(PLAYHQ_GRAPHQL_URL, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ variables, query }),
      })
      const json = await res.json()
      if (json.errors) {
        if (attempt <= retries) { await new Promise(r => setTimeout(r, 1500 * attempt)); continue }
        return { data: null, error: JSON.stringify(json.errors) }
      }
      return { data: json.data, error: null }
    } catch (e: any) {
      if (attempt <= retries) { await new Promise(r => setTimeout(r, 1500 * attempt)); continue }
      return { data: null, error: e.message }
    }
  }
  return { data: null, error: 'unknown' }
}

export interface Fixture {
  match_id: string
  date: string
  home_team: string
  away_team: string
  venue: string
  competition: string
  grade_id: string
  grade_name: string
  round: string
  status: string
}

export async function fetchUpcomingFixturesForGrade(gradeId: string): Promise<Fixture[]> {
  const roundsRes = await safePost(GRADE_ROUNDS_QUERY, { gradeID: gradeId })
  if (roundsRes.error || !roundsRes.data?.discoverGrade) return []

  const grade = roundsRes.data.discoverGrade
  const competition = grade.season?.competition?.name ?? ''
  const gradeName   = grade.name ?? ''
  const rounds: any[] = grade.rounds ?? []
  if (!rounds.length) return []

  const fixtures: Fixture[] = []
  const now = new Date()

  // Scan ALL rounds — keep every UPCOMING game with a future date.
  // (Previously only scanned current + next 2, which missed some grades.)
  for (const round of rounds) {
    const fxRes = await safePost(FIXTURE_BY_ROUND_QUERY, { roundID: round.id })
    if (fxRes.error || !fxRes.data?.discoverFixtureByRound) continue

    for (const game of fxRes.data.discoverFixtureByRound.games ?? []) {
      if (game.status?.value !== 'UPCOMING') continue
      if (!game.home?.name || !game.away?.name) continue

      const time = game.allocation?.time ?? '00:00:00'
      const dateTime = game.date ? `${game.date}T${time}` : game.date
      const gd = dateTime ? new Date(dateTime) : null
      if (gd && gd < now) continue

      fixtures.push({
        match_id:   game.id,
        date:       dateTime,
        home_team:  cleanTeamName(game.home.name),
        away_team:  cleanTeamName(game.away.name),
        venue:      game.allocation?.court?.venue?.name ?? '',
        competition,
        grade_id:   gradeId,
        grade_name: gradeName,
        round:      round.name ?? '',
        status:     'UPCOMING',
      })
    }
    // Small delay between round queries to avoid rate limiting
    await new Promise(r => setTimeout(r, 250))
  }

  return fixtures
}