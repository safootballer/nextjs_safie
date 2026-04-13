export const PLAYHQ_GRAPHQL_URL = 'https://api.playhq.com/graphql'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  'Content-Type': 'application/json',
  Origin: 'https://www.playhq.com',
  Referer: 'https://www.playhq.com/',
  tenant: 'afl',
}

const GRAPHQL_QUERY = `
query gameView($gameId: ID!) {
  discoverGame(gameID: $gameId) {
    id date
    home { ... on DiscoverTeam { name } }
    away { ... on DiscoverTeam { name } }
    allocation { court { venue { name } } }
    round { grade { season { competition { name } } } }
    result { home { score } away { score } }
    statistics {
      home {
        players {
          playerNumber
          player {
            ... on DiscoverParticipant { profile { firstName lastName } }
            ... on DiscoverParticipantFillInPlayer { profile { firstName lastName } }
            ... on DiscoverGamePermitFillInPlayer { profile { firstName lastName } }
          }
          statistics { type { value } count }
        }
        periods { period { value } statistics { type { value } count } }
        bestPlayers { ranking participant { ... on DiscoverAnonymousParticipant { name } } }
      }
      away {
        players {
          playerNumber
          player {
            ... on DiscoverParticipant { profile { firstName lastName } }
            ... on DiscoverParticipantFillInPlayer { profile { firstName lastName } }
            ... on DiscoverGamePermitFillInPlayer { profile { firstName lastName } }
          }
          statistics { type { value } count }
        }
        periods { period { value } statistics { type { value } count } }
        bestPlayers { ranking participant { ... on DiscoverAnonymousParticipant { name } } }
      }
    }
  }
}
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPeriodScores(periods: any[]): Record<string, string> {
  const quarterMap: Record<string, string> = {
    FIRST_QTR: 'Q1', SECOND_QTR: 'Q2', THIRD_QTR: 'Q3', FOURTH_QTR: 'Q4',
  }
  const goals:   Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }
  const behinds: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }
  const scores:  Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }

  for (const p of periods) {
    const q = quarterMap[p.period.value]
    if (!q) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const s of p.statistics as any[]) {
      if (s.type.value === 'TOTAL_SCORE')   scores[q]  = s.count
      else if (s.type.value === '6_POINT_SCORE') goals[q]   = s.count
      else if (s.type.value === '1_POINT_SCORE') behinds[q] = s.count
    }
  }

  const formatted: Record<string, string> = {}
  let cg = 0, cb = 0, cs = 0
  for (const q of ['Q1', 'Q2', 'Q3', 'Q4']) {
    cg += goals[q]; cb += behinds[q]; cs += scores[q]
    formatted[q] = `${cg}.${cb} (${cs})`
  }
  return formatted
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractLineup(players: any[]): string[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return players.filter((p: any) => p.player?.profile).map((p: any) =>
    `#${p.playerNumber} ${p.player.profile.firstName} ${p.player.profile.lastName}`
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractGoalScorers(players: any[]): string[] {
  const scorers: { name: string; goals: number }[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of players as any[]) {
    const profile = p.player?.profile
    if (!profile) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const goals = (p.statistics as any[])?.find((s: any) => s.type.value === '6_POINT_SCORE')?.count ?? 0
    if (goals > 0) scorers.push({ name: `${profile.firstName} ${profile.lastName}`, goals })
  }
  scorers.sort((a, b) => b.goals - a.goals)
  return scorers.map(s => `${s.name} (${s.goals})`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBestPlayers(bestPlayersData: any[]): string[] | null {
  if (!bestPlayersData?.length) return null
  try {
    return bestPlayersData
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => (a.ranking ?? 999) - (b.ranking ?? 999))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((bp: any) => bp.participant?.name as string)
      .filter(Boolean)
  } catch {
    return null
  }
}

export interface MatchData {
  match_id: string
  date: string
  home_team: string
  away_team: string
  venue: string
  competition: string
  final_score: { home: number; away: number }
  period_scores: { home: Record<string, string>; away: Record<string, string> }
  lineups: { home: string[]; away: string[] }
  goal_scorers: { home: string[]; away: string[] }
  best_players: { home: string[] | null; away: string[] | null }
}

export async function fetchMatchFromPlayHQ(matchId: string): Promise<MatchData> {
  const payload = {
    operationName: 'gameView',
    variables: { gameId: matchId },
    query: GRAPHQL_QUERY,
  }

  const res = await fetch(PLAYHQ_GRAPHQL_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  })

  const response = await res.json() as { errors?: unknown; data: { discoverGame: Record<string, unknown> } }
  if (response.errors) throw new Error(JSON.stringify(response.errors))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const game = response.data.discoverGame as any

  return {
    match_id:    game.id,
    date:        game.date,
    home_team:   game.home.name,
    away_team:   game.away.name,
    venue:       game.allocation.court.venue.name,
    competition: game.round.grade.season.competition.name,
    final_score: { home: game.result.home.score, away: game.result.away.score },
    period_scores: {
      home: extractPeriodScores(game.statistics.home.periods),
      away: extractPeriodScores(game.statistics.away.periods),
    },
    lineups: {
      home: extractLineup(game.statistics.home.players),
      away: extractLineup(game.statistics.away.players),
    },
    goal_scorers: {
      home: extractGoalScorers(game.statistics.home.players),
      away: extractGoalScorers(game.statistics.away.players),
    },
    best_players: {
      home: extractBestPlayers(game.statistics.home.bestPlayers ?? []),
      away: extractBestPlayers(game.statistics.away.bestPlayers ?? []),
    },
  }
}

export function buildMatchKnowledge(match: MatchData): string {
  const { home_team: home, away_team: away, final_score, period_scores, lineups, goal_scorers, best_players, competition, date, venue } = match
  const margin      = Math.abs(final_score.home - final_score.away)
  const hq          = period_scores.home
  const aq          = period_scores.away
  const homeScorers = goal_scorers.home.join(', ') || 'None'
  const awayScorers = goal_scorers.away.join(', ') || 'None'
  const homeBest    = best_players.home === null ? 'Not available' : (best_players.home.join(', ') || 'None')
  const awayBest    = best_players.away === null ? 'Not available' : (best_players.away.join(', ') || 'None')

  return `
${home} played ${away} in a ${competition} match.
The match took place on ${date} at ${venue} as part of the ${competition} season.

PERIOD SCORES (Cumulative Goals.Behinds):
End of Period | Q1        | Q2        | Q3        | Q4
${home}        | ${hq.Q1} | ${hq.Q2} | ${hq.Q3} | ${hq.Q4}
${away}        | ${aq.Q1} | ${aq.Q2} | ${aq.Q3} | ${aq.Q4}

Final score: ${home} ${final_score.home} defeated ${away} ${final_score.away}.
Margin: ${margin} points.

Match Competitiveness Analysis:
- Final margin: ${margin} points
- ${margin <= 20 ? 'This was a close contest' : margin <= 40 ? 'This was a comfortable victory' : 'This was a dominant performance'}

Team lineups:
${home}:
- ${lineups.home.join('\n- ')}

${away}:
- ${lineups.away.join('\n- ')}

GOAL SCORERS (OFFICIAL):
${home}: ${homeScorers}
${away}: ${awayScorers}

BEST PLAYERS (OFFICIAL):
${home}: ${homeBest}
${away}: ${awayBest}
`.trim()
}
