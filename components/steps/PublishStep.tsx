'use client'
import { useState, useEffect } from 'react'
import { SectionHeading } from './MatchSelectStep'
import { slugify } from '@/lib/publishers'
import { AUTHORS, COUNTRY_LEAGUES } from '@/lib/constants'

const COMPETITION_OPTIONS = ['AFL', 'AFLW', 'SANFL', 'SANFLW', 'Amateur', "SAWFL Women's", 'Country Football']

const SANFL_GRADES: Record<string, string> = {
  'League':   'league',
  'Reserves': 'reserves',
  'Under 18': 'under-18',
  'Under 16': 'under-16',
}

const SAWFL_GRADES: Record<string, string> = {
  'Division 1':          'division-1',
  'Division 2':          'division-2',
  'Division 3':          'division-3',
  'Division 4':          'division-4',
  'Division 5':          'division-5',
  'Division 6':          'division-6',
  'Division 1 Reserves': 'division-1-reserves',
  'Division 2 Reserves': 'division-2-reserves',
}

const AMATEUR_GRADES: Record<string, string> = {
  'Division 1':           'division-1',
  'Division 2':           'division-2',
  'Division 3':           'division-3',
  'Division 4':           'division-4',
  'Division 5':           'division-5',
  'Division 6':           'division-6',
  'Division 7':           'division-7',
  'Division 1 Reserves':  'division-1-reserves',
  'Division 2 Reserves':  'division-2-reserves',
  'Division 3 Reserves':  'division-3-reserves',
  'Division 4 Reserves':  'division-4-reserves',
  'Division 5 Reserves':  'division-5-reserves',
  'Division 6 Reserves':  'division-6-reserves',
  'Division 7 Reserves':  'division-7-reserves',
  'Division C1':          'division-c1',
  'Division C2':          'division-c2',
  'Division C3':          'division-c3',
  'Division C4':          'division-c4',
  'Division C5':          'division-c5',
  'Division C6':          'division-c6',
  'Division C7':          'division-c7',
  'Division C8':          'division-c8',
}

interface Meta {
  competition: string
  detectedCountryLeague: string | null
  isCountryFootball: boolean
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  homeScoreFormatted?: string
  awayScoreFormatted?: string
  date: string
  venue: string
  amateurGrade?: string | null
  sanflGrade?: string | null
}

interface Props {
  content: string
  contentType: string
  meta?: Meta
  publishedSlug: string
  onPublished: (slug: string) => void
}

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, '\n').replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n').trim()
}

function formatScore(score: number): string {
  if (!score && score !== 0) return ''
  for (let g = Math.floor(score / 6); g >= 0; g--) {
    const b = score - g * 6
    if (b >= 0 && b < 20) return `${g}.${b} (${score})`
  }
  return String(score)
}

function cleanTeamName(name: string): string {
  if (!name) return ''
  return name
    .replace(/\s*-\s*M\d+R?\s*$/i, '').replace(/\s*-\s*W\d+R?\s*$/i, '')
    .replace(/\s*-\s*C\d+\s*$/i, '').replace(/\s*-?\s*[A-Z]\s+Grade\s*$/i, '')
    .replace(/\s*-\s*Under\s*[\d.]+\s*$/i, '').replace(/\s*-\s*U\d+\s*$/i, '')
    .replace(/\s*\bM\d+R?\b\s*$/i, '').replace(/\s*\bW\d+R?\b\s*$/i, '')
    .replace(/\s*\bC\d+\b\s*$/i, '').replace(/\s*[-–]\s*Men'?s?\s*$/i, '')
    .replace(/\s*[-–]\s*Women'?s?\s*$/i, '').replace(/\s*\bMen'?s?\b\s*$/i, '')
    .replace(/\s*\bWomen'?s?\b\s*$/i, '').replace(/\s*[-–]\s*Seniors?\s*$/i, '')
    .replace(/\s*[-–]\s*Juniors?\s*$/i, '').replace(/\s*\bSeniors?\b\s*$/i, '')
    .replace(/\s*\bJuniors?\b\s*$/i, '').replace(/\s*[-–]?\s*[A-H]\s+Grade\s*$/i, '')
    .replace(/\s*[-–]?\s*Senior\s+Men'?s?\s*$/i, '').replace(/\s*[-–]?\s*Senior\s+Women'?s?\s*$/i, '')
    .replace(/\s*[-–]\s*[A-Z]\s*$/i, '').replace(/\s+Football Club\s*$/i, '')
    .replace(/\s+FC\s*$/i, '').replace(/\s*\bLeague\b\s*$/i, '')
    .replace(/\s*\bReserves\b\s*$/i, '').replace(/\s*\bU[\d.]+\s*Mixed\b\s*$/i, '')
    .replace(/\s*\bUnder\s*[\d.]+\s*Mixed\b\s*$/i, '').replace(/\s*\bBoys\s+Under\s*[\d.]+\b\s*$/i, '')
    .replace(/\s*\bGirls\s+Under\s*[\d.]+\b\s*$/i, '').replace(/\s*\bUnder\s*[\d.]+\s*Boys\b\s*$/i, '')
    .replace(/\s*\bUnder\s*[\d.]+\s*Girls\b\s*$/i, '').replace(/\s*\bU[\d.]+\s*Boys\b\s*$/i, '')
    .replace(/\s*\bU[\d.]+\s*Girls\b\s*$/i, '').replace(/\s*\bU[\d.]+s?\b\s*$/i, '')
    .replace(/\s*\bUnder\s*[\d.]+\b\s*$/i, '').replace(/\s*\bSnr\s+Colts\b\s*$/i, '')
    .replace(/\s*\bSenior\s+Colts\b\s*$/i, '').replace(/\s*\bColts\b\s*$/i, '')
    .replace(/\s*\bMixed\b\s*$/i, '').trim()
}

export function PublishStep({ content, contentType, meta, publishedSlug, onPublished }: Props) {
  const plain = stripHtml(content)
  const cleanTitle = (plain.split('\n').map(l => l.trim()).find(l => l.length > 5) ?? '')
    .replace(/^#+\s*/, '').replace(/\*+/g, '').slice(0, 120)

  const [title, setTitle]                 = useState(cleanTitle)
  const [slug, setSlug]                   = useState(slugify(cleanTitle))
  const [author, setAuthor]               = useState(AUTHORS[0])
  const [competition, setCompetition]     = useState('AFL')
  const [countryLeague, setCountryLeague] = useState('')
  const [amateurGrade, setAmateurGrade]   = useState('')
  const [sawflGrade, setSawflGrade]       = useState('')
  const [sanflGrade, setSanflGrade]       = useState('')
  const [homeTeam, setHomeTeam]   = useState('')
  const [awayTeam, setAwayTeam]   = useState('')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [venue, setVenue]         = useState('')
  const [round, setRound]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [fbLoading, setFbLoading] = useState(false)
  const [error, setError]         = useState('')
  const [fbError, setFbError]     = useState('')
  const [fbSuccess, setFbSuccess] = useState('')

  useEffect(() => {
    if (!meta) return
    const home = cleanTeamName(meta.homeTeam)
    const away = cleanTeamName(meta.awayTeam)
    const v    = meta.venue ?? ''
    if (meta.homeTeam) setHomeTeam(home)
    if (meta.awayTeam) setAwayTeam(away)
    if (home && away) {
      const autoTitle = v ? `${home} v ${away} @ ${v}` : `${home} v ${away}`
      setTitle(autoTitle)
      setSlug(slugify(autoTitle))
    }
    if (meta.homeScoreFormatted) setHomeScore(meta.homeScoreFormatted)
    else if (meta.homeScore) setHomeScore(formatScore(meta.homeScore))
    if (meta.awayScoreFormatted) setAwayScore(meta.awayScoreFormatted)
    else if (meta.awayScore) setAwayScore(formatScore(meta.awayScore))
    if (meta.venue) setVenue(meta.venue)
    if (meta.date) {
      try {
        const d = new Date(meta.date)
        if (!isNaN(d.getTime())) {
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          setMatchDate(local.toISOString().slice(0, 16))
        }
      } catch { /* ignore */ }
    }
    if (meta.isCountryFootball) {
      setCompetition('Country Football')
      setCountryLeague(meta.detectedCountryLeague ?? '')
    } else {
      const comp = COMPETITION_OPTIONS.includes(meta.competition) ? meta.competition : 'AFL'
      setCompetition(comp)
      if (comp === 'Amateur' && meta.amateurGrade) setAmateurGrade(meta.amateurGrade)
      if (comp === "SAWFL Women's" && meta.amateurGrade) setSawflGrade(meta.amateurGrade)
      if (comp === 'SANFL' && meta.sanflGrade) setSanflGrade(meta.sanflGrade)
    }
  }, [meta])

  useEffect(() => { setSlug(slugify(title)) }, [title])

  const ready = Boolean(
    title && slug && homeTeam && awayTeam && homeScore && awayScore && matchDate &&
    (competition !== 'Country Football' || countryLeague) &&
    (competition !== 'Amateur' || amateurGrade) &&
    (competition !== "SAWFL Women's" || sawflGrade) &&
    (competition !== 'SANFL' || sanflGrade)
  )

  async function publishToWeb(asDraft: boolean): Promise<string | null> {
    setLoading(true)
    setError('')
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, slug, competition, contentText: content, author,
        countryLeague: competition === 'Country Football' ? countryLeague : null,
        amateurGrade:  competition === 'Amateur' ? amateurGrade : competition === "SAWFL Women's" ? sawflGrade : null,
        sanflGrade:    competition === 'SANFL' ? sanflGrade : null,
        homeTeam, awayTeam, homeScore, awayScore, matchDate, venue, round, asDraft,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) {
      if (!asDraft) onPublished(data.slug)
      return data.slug
    } else {
      setError(data.error ?? 'Publish failed')
      return null
    }
  }

  async function publishToFacebook(slug?: string) {
    setFbLoading(true)
    setFbError('')
    setFbSuccess('')
    const liveUrl = slug
      ? `https://www.safootballer.com.au/match-results/${slug}`
      : publishedSlug ? `https://www.safootballer.com.au/match-results/${publishedSlug}` : ''
    const message = plain.slice(0, 900) + (plain.length > 900 ? '...' : '')
    try {
      const res = await fetch('/api/publish-facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, link: liveUrl }),
      })
      const data = await res.json()
      if (data.success) setFbSuccess('Posted to Facebook!')
      else setFbError(data.error ?? 'Facebook post failed')
    } catch (e: any) {
      setFbError(e.message)
    }
    setFbLoading(false)
  }

  async function publishBoth() {
    const resultSlug = await publishToWeb(false)
    if (resultSlug) await publishToFacebook(resultSlug)
  }

  const baseUrl = 'https://www.safootballer.com.au'
  const liveUrl = competition === 'Country Football' && countryLeague
    ? `${baseUrl}/country-football?league=${countryLeague}`
    : `${baseUrl}/match-results/${publishedSlug}`

  const labelStyle = {
    fontSize: '0.75rem' as const, fontWeight: 700,
    color: 'rgba(255,255,255,0.5)' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', marginBottom: '0.4rem', display: 'block' as const,
  }

  return (
    <section className="fade-up">
      <SectionHeading step={4} title="Publish to Website" />

      {publishedSlug && (
        <div className="alert-success" style={{ marginBottom: '1.25rem' }}>
          {'Match report is LIVE! '}
          <a href={liveUrl} target="_blank" rel="noreferrer" style={{ color: '#4ade80', textDecoration: 'underline' }}>
            {competition === 'Country Football' ? 'View on Country Football page' : 'View match report'}
          </a>
        </div>
      )}

      <div className="alert-info" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #e6fe00' }}>
        {'Match details have been pre-filled from PlayHQ. Verify and hit '}
        <strong style={{ color: '#e6fe00' }}>{'Publish Live'}</strong>
        {competition === 'Country Football' ? ' — appears on the Country Football page immediately.' : ' — appears on the Match Results page immediately.'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>{'Article Title *'}</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Glenelg Dominate in 45-Point Victory" className="input-field" />
          </div>
          <div>
            <label style={labelStyle}>{'Slug (URL path) *'}</label>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className="input-field" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>{'Home Team *'}</label>
              <input type="text" value={homeTeam} onChange={e => setHomeTeam(e.target.value)} placeholder="e.g. Glenelg" className="input-field" />
            </div>
            <div>
              <label style={labelStyle}>{'Away Team *'}</label>
              <input type="text" value={awayTeam} onChange={e => setAwayTeam(e.target.value)} placeholder="e.g. Sturt" className="input-field" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>{'Home Score *'}</label>
              <input type="text" value={homeScore} onChange={e => setHomeScore(e.target.value)} placeholder="e.g. 12.8 (80)" className="input-field" />
            </div>
            <div>
              <label style={labelStyle}>{'Away Score *'}</label>
              <input type="text" value={awayScore} onChange={e => setAwayScore(e.target.value)} placeholder="e.g. 7.5 (47)" className="input-field" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>{'Match Date *'}</label>
            <input type="datetime-local" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="input-field" />
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>{'Venue'}</label>
              <input type="text" value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Gliderol Stadium" className="input-field" />
            </div>
            <div>
              <label style={labelStyle}>{'Round'}</label>
              <input type="text" value={round} onChange={e => setRound(e.target.value)} placeholder="e.g. Round 3" className="input-field" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>{'Competition *'}</label>
            <select value={competition} onChange={e => { setCompetition(e.target.value); setAmateurGrade(''); setSawflGrade(''); setCountryLeague(''); setSanflGrade('') }} className="input-field">
              {COMPETITION_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {competition === 'SANFL' && (
            <div>
              <label style={labelStyle}>
                {'SANFL Grade *'}
                {meta?.sanflGrade && <span style={{ color: '#4ade80', marginLeft: '0.5rem', textTransform: 'none', fontSize: '0.7rem' }}>✅ Auto-detected</span>}
              </label>
              <select value={sanflGrade} onChange={e => setSanflGrade(e.target.value)} className="input-field">
                <option value="">— Select grade —</option>
                {Object.entries(SANFL_GRADES).map(([name, val]) => <option key={val} value={val}>{name}</option>)}
              </select>
            </div>
          )}

          {competition === 'Amateur' && (
            <div>
              <label style={labelStyle}>
                {'Amateur Grade *'}
                {meta?.amateurGrade && <span style={{ color: '#4ade80', marginLeft: '0.5rem', textTransform: 'none', fontSize: '0.7rem' }}>✅ Auto-detected</span>}
              </label>
              <select value={amateurGrade} onChange={e => setAmateurGrade(e.target.value)} className="input-field">
                <option value="">— Select grade —</option>
                {Object.entries(AMATEUR_GRADES).map(([name, val]) => <option key={val} value={val}>{name}</option>)}
              </select>
            </div>
          )}

          {competition === "SAWFL Women's" && (
            <div>
              <label style={labelStyle}>
                {"SAWFL Women's Grade *"}
                {meta?.amateurGrade && <span style={{ color: '#4ade80', marginLeft: '0.5rem', textTransform: 'none', fontSize: '0.7rem' }}>✅ Auto-detected</span>}
              </label>
              <select value={sawflGrade} onChange={e => setSawflGrade(e.target.value)} className="input-field">
                <option value="">— Select grade —</option>
                {Object.entries(SAWFL_GRADES).map(([name, val]) => <option key={val} value={val}>{name}</option>)}
              </select>
            </div>
          )}

          {competition === 'Country Football' && (
            <div>
              <label style={labelStyle}>{'Country League *'}</label>
              <select value={countryLeague} onChange={e => setCountryLeague(e.target.value)} className="input-field">
                <option value="">— Select league —</option>
                {Object.entries(COUNTRY_LEAGUES).map(([name, val]) => <option key={val} value={val}>{name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label style={labelStyle}>{'Author'}</label>
            <select value={author} onChange={e => setAuthor(e.target.value)} className="input-field">
              {AUTHORS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          {!ready && (
            <div className="alert-warning">
              {competition === 'Country Football' ? 'Fill in all fields including Country League to publish.'
                : competition === 'Amateur' ? 'Fill in all fields including Amateur Grade to publish.'
                : competition === "SAWFL Women's" ? "Fill in all fields including SAWFL Women's Grade to publish."
                : competition === 'SANFL' ? 'Fill in all fields including SANFL Grade to publish.'
                : 'Fill in Title, Slug, both teams, scores and match date to publish.'}
            </div>
          )}

          {error    && <div className="alert-error">{error}</div>}
          {fbError  && <div className="alert-error">Facebook: {fbError}</div>}
          {fbSuccess && <div style={{ background: '#f0fdf4', border: '1px solid #4ade80', color: '#166534', padding: '0.75rem', borderRadius: 8, fontSize: '0.9rem' }}>{fbSuccess}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
            <button onClick={() => publishToWeb(false)} disabled={!ready || loading || fbLoading} className="btn-primary" style={{ width: '100%', padding: '0.9rem' }}>
              {loading ? 'Publishing...' : '🌐 Publish to Web'}
            </button>
            <button onClick={() => publishToFacebook()} disabled={fbLoading || loading} style={{
              width: '100%', padding: '0.9rem', background: '#1877F2', color: '#fff',
              border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
            }}>
              {fbLoading ? 'Posting to Facebook...' : '📘 Publish to Facebook'}
            </button>
            <button onClick={publishBoth} disabled={!ready || loading || fbLoading} style={{
              width: '100%', padding: '0.9rem', background: '#e6fe00', color: '#000',
              border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
            }}>
              {loading || fbLoading ? 'Publishing...' : '🚀 Publish to Both'}
            </button>
            <button onClick={() => publishToWeb(true)} disabled={!title || loading} className="btn-yellow" style={{ width: '100%', padding: '0.9rem', opacity: 0.7 }}>
              {'Save as Draft'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}