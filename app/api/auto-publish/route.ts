import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { getPrompt, calculateOpenAICost, AUTHORS } from '@/lib/constants'
import { publishToSanity, slugify } from '@/lib/publishers'

const openai     = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MAX_ATTEMPTS = 7
const MODEL        = 'gpt-4o-mini'

// ── Quality checker ────────────────────────────────────────────────────────────
function buildQualityPrompt(report: string, match: any): string {
  return `You are a strict quality checker for Australian football match reports.
Check the report against the ground truth and respond ONLY with JSON:
{"passed": true} or {"passed": false, "reasons": ["reason 1", "reason 2"]}

GROUND TRUTH:
- Home Team: ${match.home_team}
- Away Team: ${match.away_team}
- Final Score: ${match.home_final_score} - ${match.away_final_score}
- Venue: ${match.venue ?? 'Unknown'}
- Goal Scorers: ${match.goal_scorers ?? 'Not provided'}
- Best Players: ${match.best_players ?? 'Not provided'}
- Quarter Scores: ${match.quarter_scores ?? 'Not provided'}

RULES — FAIL if ANY violated:
DO's:
1. Both team names must appear correctly
2. Final score must be mentioned and match ground truth
3. Venue must be mentioned if provided
4. At least one quarter referenced if quarter scores provided
5. At least some goal scorers mentioned if provided
6. At least some best players mentioned if provided
7. Must be about Australian Rules Football only

DON'Ts:
1. Wrong team names or misspellings
2. Scores contradicting ground truth
3. Offensive, political or inappropriate language
4. Player names not in goal scorers or best players data
5. Soccer terminology (back of the net, clean sheet, goalkeeper, pitch, nil, penalty kick)
6. Fabricated events not supported by data

REPORT:
${report}

Respond ONLY with JSON.`
}

// ── Build context ──────────────────────────────────────────────────────────────
function buildContext(match: any, link: any): string {
  const qs = match.quarter_scores ? JSON.parse(match.quarter_scores) : null
  const gs = match.goal_scorers   ? JSON.parse(match.goal_scorers)   : null
  const bp = match.best_players   ? JSON.parse(match.best_players)   : null

  const margin = Math.abs((match.home_final_score ?? 0) - (match.away_final_score ?? 0))

  // Clean team names — remove grade suffixes
  const cleanName = (name: string) => name
    .replace(/\s*-\s*M\d+R?\s*$/i, '')
    .replace(/\s*-\s*W\d+R?\s*$/i, '')
    .replace(/\s*-\s*C\d+\s*$/i, '')
    .replace(/\s*-?\s*[A-Z]\s+Grade\s*$/i, '')
    .replace(/\s*-\s*Under\s*\d+\s*$/i, '')
    .replace(/\s*\bM\d+R?\b\s*$/i, '')
    .replace(/\s*\bW\d+R?\b\s*$/i, '')
    .replace(/\s*\bC\d+\b\s*$/i, '')
    .trim()

  const home = cleanName(match.home_team ?? '')
  const away = cleanName(match.away_team ?? '')

  // Build correct competition label
  let competitionLabel = link?.competition ?? match.competition ?? 'Unknown'
  if (competitionLabel === 'Amateur') competitionLabel = 'Adelaide Footy League'
  if (competitionLabel === "SAWFL Women's") competitionLabel = "SA Women's Football League"
  if (competitionLabel === 'SANFL') {
    if (link?.sanfl_grade === 'under-16') competitionLabel = 'SANFL Under 16'
    else if (link?.sanfl_grade === 'under-18') competitionLabel = 'SANFL Under 18'
    else competitionLabel = 'SANFL'
  }
  if (competitionLabel === 'Country Football' && link?.grade_name) {
    competitionLabel = link.grade_name
  }

  let ctx = `Competition: ${competitionLabel}
Home Team: ${home}
Away Team: ${away}
Venue: ${match.venue ?? 'Unknown'}
Date: ${match.date ?? 'Unknown'}
Final Score: ${home} ${match.home_final_score} - ${match.away_final_score} ${away}
Margin: ${margin} points
Match Competitiveness Analysis: margin is ${margin} points`

  if (qs) ctx += `\n\nQuarter Scores:\n${JSON.stringify(qs, null, 2)}`
  if (gs) ctx += `\n\nGOAL SCORERS (OFFICIAL):\n${JSON.stringify(gs, null, 2)}`
  if (bp) ctx += `\n\nBEST PLAYERS (OFFICIAL):\n${JSON.stringify(bp, null, 2)}`

  return ctx
}

// ── Main route ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-auto-publish-secret')
  if (secret !== process.env.AUTO_PUBLISH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { matchId } = await req.json()
  if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 })

  const match = await prisma.match.findFirst({ where: { match_id: matchId } })
  if (!match) return NextResponse.json({ error: 'Match not found in DB' }, { status: 404 })

  const link = await prisma.matchLink.findFirst({ where: { match_id: matchId } })

  const competition   = link?.competition ?? 'Unknown'
  const amateurGrade  = link?.amateur_grade ?? null
  const sanflGrade    = link?.sanfl_grade   ?? null

  const context = buildContext(match, link)
  const prompt  = getPrompt('Magazine match report').replace('{context}', context)

  let report      = ''
  let passed      = false
  let lastReasons: string[] = []
  let attempt     = 0
  let totalCost   = 0

  while (attempt < MAX_ATTEMPTS && !passed) {
    attempt++
    console.log(`[AUTO] Attempt ${attempt}/${MAX_ATTEMPTS} for ${matchId}`)

    try {
      // Generate
      const gen = await openai.chat.completions.create({
        model: MODEL, temperature: 0.25, max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      })
      report = gen.choices[0].message.content ?? ''
      if (gen.usage) totalCost += calculateOpenAICost(gen.usage.prompt_tokens, gen.usage.completion_tokens, MODEL)

      // Quality check
      const qc = await openai.chat.completions.create({
        model: MODEL, temperature: 0, max_tokens: 200,
        messages: [{ role: 'user', content: buildQualityPrompt(report, match) }],
      })
      const raw    = qc.choices[0].message.content ?? '{}'
      const result = JSON.parse(raw.replace(/```json|```/g, '').trim())
      passed      = result.passed
      lastReasons = result.reasons ?? []
      console.log(`[AUTO] QC attempt ${attempt}: ${passed ? 'PASSED' : 'FAILED'} — ${lastReasons.join(', ')}`)
    } catch (e: any) {
      console.error(`[AUTO] Error attempt ${attempt}: ${e.message}`)
    }
  }

  if (!passed) {
    return NextResponse.json({
      success: false, matchId,
      error: `Quality check failed after ${MAX_ATTEMPTS} attempts`,
      reasons: lastReasons,
    }, { status: 422 })
  }

  // Build title and slug
  const homeClean = (match.home_team ?? '').replace(/\s*-\s*\w+\s*$/i, '').trim()
  const awayClean = (match.away_team ?? '').replace(/\s*-\s*\w+\s*$/i, '').trim()
  const title     = `${homeClean} v ${awayClean}`
  const slug      = slugify(`${title} ${match.date?.slice(0, 10) ?? ''}`)
  const author    = AUTHORS[Math.floor(Math.random() * AUTHORS.length)]

  // Determine country league
  const countryLeague = competition === 'Country Football'
    ? (link?.grade_name ?? null)
    : null

  const result = await publishToSanity({
    title, slug, competition,
    contentText: report, author,
    countryLeague,
    amateurGrade,
    sanflGrade,
    homeTeam:  match.home_team ?? '',
    awayTeam:  match.away_team ?? '',
    homeScore: String(match.home_final_score ?? ''),
    awayScore: String(match.away_final_score ?? ''),
    matchDate: match.date ?? new Date().toISOString(),
    venue:     match.venue ?? '',
    asDraft:   false,
  })

  if (!result.success) {
    return NextResponse.json({ success: false, matchId, error: result.result }, { status: 500 })
  }

  // Log cost
  try {
    await prisma.generationCost.create({
      data: {
        match_id: matchId, content_type: 'Auto Magazine Report',
        prompt_tokens: 0, completion_tokens: 0, total_tokens: 0,
        cost_usd: totalCost, model: MODEL,
        generated_at: new Date().toISOString(),
      }
    })
    
  } catch { /* non-fatal */ }

  console.log(`[AUTO] Published ${slug} after ${attempt} attempt(s)`)
  return NextResponse.json({ success: true, matchId, slug, attempts: attempt, totalCost })
}