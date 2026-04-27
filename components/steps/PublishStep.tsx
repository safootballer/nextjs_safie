'use client'
import { useState, useEffect } from 'react'
import { SectionHeading } from './MatchSelectStep'
import { slugify } from '@/lib/publishers'
import { AUTHORS, COMPETITION_MAP, COUNTRY_LEAGUES } from '@/lib/constants'

const COMPETITION_OPTIONS = ['AFL', 'AFLW', 'SANFL', 'SANFLW', 'Amateur', "SAWFL Women's", 'Country Football']

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

// Map PlayHQ grade IDs to amateurGrade values
const PLAYHQ_GRADE_TO_AMATEUR: Record<string, string> = {
  '8eecd4b0': 'division-1',
  '85247b82': 'division-2',
  '372b55e9': 'division-3',
  '22794d03': 'division-4',
  '372d8776': 'division-5',
  '961ce426': 'division-6',
  '43b5cc78': 'division-7',
  '1f82c881': 'division-1-reserves',
  '8ebba3c8': 'division-2-reserves',
  'b9156c34': 'division-3-reserves',
  '692c9b17': 'division-4-reserves',
  'cedbc98d': 'division-5-reserves',
  '3beb6a9e': 'division-6-reserves',
  '1991ba25': 'division-7-reserves',
  'd7fe9dd5': 'division-c1',
  'aea638ff': 'division-c2',
  '256a623b': 'division-c3',
  '1bd8ff22': 'division-c4',
  '792996a6': 'division-c5',
  'a645b2ca': 'division-c6',
  '69f075a6': 'division-c7',
  'a374a910': 'division-c8',
}

interface Meta {
  competition: string
  detectedCountryLeague: string | null
  isCountryFootball: boolean
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  date: string
  venue: string
  gradeId?: string
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
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function formatScore(score: number): string {
  if (!score && score !== 0) return ''
  for (let g = Math.floor(score / 6); g >= 0; g--) {
    const b = score - g * 6
    if (b >= 0 && b < 20) return `${g}.${b} (${score})`
  }
  return String(score)
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

  const [homeTeam, setHomeTeam]   = useState('')
  const [awayTeam, setAwayTeam]   = useState('')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [venue, setVenue]         = useState('')
  const [round, setRound]         = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!meta) return

    if (meta.homeTeam) setHomeTeam(meta.homeTeam)
    if (meta.awayTeam) setAwayTeam(meta.awayTeam)
    if (meta.homeScore) setHomeScore(formatScore(meta.homeScore))
    if (meta.awayScore) setAwayScore(formatScore(meta.awayScore))
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
      const m = COMPETITION_MAP[meta.competition] ?? 'AFL'
      const comp = COMPETITION_OPTIONS.includes(m) ? m : 'AFL'
      setCompetition(comp)

      // Auto-detect amateur grade from gradeId
      if (comp === 'Amateur' && meta.gradeId && PLAYHQ_GRADE_TO_AMATEUR[meta.gradeId]) {
        setAmateurGrade(PLAYHQ_GRADE_TO_AMATEUR[meta.gradeId])
      }
    }
  }, [meta])

  useEffect(() => { setSlug(slugify(title)) }, [title])

  const ready = Boolean(
    title && slug && homeTeam && awayTeam && homeScore && awayScore && matchDate &&
    (competition !== 'Country Football' || countryLeague) &&
    (competition !== 'Amateur' || amateurGrade)
  )

  async function publish(asDraft: boolean) {
    setLoading(true); setError('')
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, slug, competition,
        contentText: content, author,
        countryLeague: competition === 'Country Football' ? countryLeague : null,
        amateurGrade: competition === 'Amateur' ? amateurGrade : null,
        homeTeam, awayTeam, homeScore, awayScore,
        matchDate, venue, round, asDraft,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) {
      if (!asDraft) onPublished(data.slug)
      else alert('Draft saved in Sanity Studio!')
    } else {
      setError(data.error ?? 'Publish failed')
    }
  }

  const baseUrl = 'https://www.safootballer.com.au'
  const liveUrl = competition === 'Country Football' && countryLeague
    ? `${baseUrl}/country-football?league=${countryLeague}`
    : `${baseUrl}/match-results/${publishedSlug}`

  const labelStyle = {
    fontSize: '0.75rem' as const,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '0.4rem',
    display: 'block' as const,
  }

  const publishBtnLabel = () => {
    if (loading) return 'Publishing...'
    if (competition === 'Country Football') return 'Publish to Country Football Page'
    return 'Publish Live Now'
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
        {competition === 'Country Football'
          ? ' — appears on the Country Football page immediately.'
          : ' — appears on the Match Results page immediately.'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div>
            <label style={labelStyle}>{'Article Title *'}</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Glenelg Dominate in 45-Point Victory" className="input-field" />
          </div>

          <div>
            <label style={labelStyle}>{'Slug (URL path) *'}</label>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
              className="input-field" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>{'Home Team *'}</label>
              <input type="text" value={homeTeam} onChange={e => setHomeTeam(e.target.value)}
                placeholder="e.g. Glenelg" className="input-field" />
            </div>
            <div>
              <label style={labelStyle}>{'Away Team *'}</label>
              <input type="text" value={awayTeam} onChange={e => setAwayTeam(e.target.value)}
                placeholder="e.g. Sturt" className="input-field" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>{'Home Score *'}</label>
              <input type="text" value={homeScore} onChange={e => setHomeScore(e.target.value)}
                placeholder="e.g. 12.8 (80)" className="input-field" />
            </div>
            <div>
              <label style={labelStyle}>{'Away Score *'}</label>
              <input type="text" value={awayScore} onChange={e => setAwayScore(e.target.value)}
                placeholder="e.g. 7.5 (47)" className="input-field" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>{'Match Date *'}</label>
            <input type="datetime-local" value={matchDate} onChange={e => setMatchDate(e.target.value)}
              className="input-field" />
          </div>

        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>{'Venue'}</label>
              <input type="text" value={venue} onChange={e => setVenue(e.target.value)}
                placeholder="e.g. Gliderol Stadium" className="input-field" />
            </div>
            <div>
              <label style={labelStyle}>{'Round'}</label>
              <input type="text" value={round} onChange={e => setRound(e.target.value)}
                placeholder="e.g. Round 3" className="input-field" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>{'Competition *'}</label>
            <select value={competition} onChange={e => { setCompetition(e.target.value); setAmateurGrade(''); setCountryLeague('') }} className="input-field">
              {COMPETITION_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {competition === 'Amateur' && (
            <div>
              <label style={labelStyle}>{'Amateur Grade *'}</label>
              <select value={amateurGrade} onChange={e => setAmateurGrade(e.target.value)} className="input-field">
                <option value="">— Select grade —</option>
                {Object.entries(AMATEUR_GRADES).map(([name, val]) => (
                  <option key={val} value={val}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {competition === 'Country Football' && (
            <div>
              <label style={labelStyle}>{'Country League *'}</label>
              <select value={countryLeague} onChange={e => setCountryLeague(e.target.value)} className="input-field">
                <option value="">— Select league —</option>
                {Object.entries(COUNTRY_LEAGUES).map(([name, val]) => (
                  <option key={val} value={val}>{name}</option>
                ))}
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
              {competition === 'Country Football'
                ? 'Fill in all fields including Country League to publish.'
                : competition === 'Amateur'
                ? 'Fill in all fields including Amateur Grade to publish.'
                : 'Fill in Title, Slug, both teams, scores and match date to publish.'}
            </div>
          )}
          {error && <div className="alert-error">{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
            <button onClick={() => publish(false)} disabled={!ready || loading}
              className="btn-primary" style={{ width: '100%', padding: '0.9rem' }}>
              {publishBtnLabel()}
            </button>
            <button onClick={() => publish(true)} disabled={!title || loading}
              className="btn-yellow" style={{ width: '100%', padding: '0.9rem' }}>
              {'Save as Draft'}
            </button>
          </div>

        </div>
      </div>
    </section>
  )
}