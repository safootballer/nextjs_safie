'use client'
import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { slugify } from '@/lib/publishers'
import { AUTHORS, COUNTRY_LEAGUES } from '@/lib/constants'
import { KBResult } from '@/app/dashboard/page'
import { SectionHeading } from './MatchSelectStep'

const COMPETITION_OPTIONS = ['AFL', 'AFLW', 'SANFL', 'SANFLW', 'Amateur', "SAWFL Women's", 'Country Football']
const SANFL_GRADES: Record<string, string> = { 'League': 'league', 'Reserves': 'reserves', 'Under 18': 'under-18', 'Under 16': 'under-16' }
const SAWFL_GRADES: Record<string, string> = {
  'Division 1': 'division-1', 'Division 2': 'division-2', 'Division 3': 'division-3',
  'Division 4': 'division-4', 'Division 5': 'division-5', 'Division 6': 'division-6',
  'Division 1 Reserves': 'division-1-reserves', 'Division 2 Reserves': 'division-2-reserves',
}
const AMATEUR_GRADES: Record<string, string> = {
  'Division 1': 'division-1', 'Division 2': 'division-2', 'Division 3': 'division-3',
  'Division 4': 'division-4', 'Division 5': 'division-5', 'Division 6': 'division-6',
  'Division 7': 'division-7',
  'Division 1 Reserves': 'division-1-reserves', 'Division 2 Reserves': 'division-2-reserves',
  'Division 3 Reserves': 'division-3-reserves', 'Division 4 Reserves': 'division-4-reserves',
  'Division 5 Reserves': 'division-5-reserves', 'Division 6 Reserves': 'division-6-reserves',
  'Division 7 Reserves': 'division-7-reserves',
  'Division C1': 'division-c1', 'Division C2': 'division-c2', 'Division C3': 'division-c3',
  'Division C4': 'division-c4', 'Division C5': 'division-c5', 'Division C6': 'division-c6',
  'Division C7': 'division-c7', 'Division C8': 'division-c8',
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

function markdownToHtml(text: string): string {
  let normalised = text
  normalised = normalised.replace(/(\S)\s*\|\s*/g, '$1\n| ')
  return normalised.split('\n\n').filter(Boolean).map(block => {
    const trimmed = block.trim()
    const lines = trimmed.split('\n').map((l: string) => l.trim()).filter(Boolean)
    const isPipeTable = lines.length >= 2 && lines.filter((l: string) => l.startsWith('|')).length >= 2
    if (isPipeTable) {
      const tableLines = lines.filter((l: string) => l.startsWith('|') && !/^\|[-| :]+\|$/.test(l))
      const rows = tableLines.map(line =>
        line.split('|').map((c: string) => c.trim()).filter((c: string, i: number, a: string[]) =>
          !(i === 0 && c === '') && !(i === a.length - 1 && c === '')
        )
      )
      if (rows.length < 2) return `<p>${trimmed}</p>`
      const headerRow = rows[0]
      const dataRows = rows.slice(1)
      let table = '<table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:0.88rem">'
      table += '<thead><tr style="background:#2ca3ee;color:#fff">'
      headerRow.forEach((cell: string) => {
        table += `<th style="padding:0.4rem 0.75rem;text-align:center;font-weight:700;border:1px solid #d1d5db">${cell}</th>`
      })
      table += '</tr></thead><tbody>'
      dataRows.forEach((row: string[], ri: number) => {
        const bg = ri % 2 === 0 ? '#f9fafb' : '#fff'
        table += `<tr style="background:${bg}">`
        row.forEach((cell: string, ci: number) => {
          const align = ci === 0 ? 'left' : 'center'
          const weight = ci === 0 ? '600' : '400'
          table += `<td style="padding:0.4rem 0.75rem;text-align:${align};font-weight:${weight};border:1px solid #d1d5db">${cell}</td>`
        })
        table += '</tr>'
      })
      table += '</tbody></table>'
      return table
    }
    if (/^\*\*[^*\n]+\*\*$/.test(trimmed)) {
      return `<h2>${trimmed.replace(/^\*\*|\*\*$/g, '').trim()}</h2>`
    }
    return `<p>${trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</p>`
  }).join('')
}

// ── Single match card ──────────────────────────────────────────────────────────
function MatchCard({ kb }: { kb: KBResult }) {
  const meta = kb.meta
  const homeTeam = cleanTeamName(meta.homeTeam)
  const awayTeam = cleanTeamName(meta.awayTeam)

  const [generating, setGenerating]       = useState(false)
  const [publishing, setPublishing]       = useState(false)
  const [fbLoading, setFbLoading]         = useState(false)
  const [generated, setGenerated]         = useState('')
  const [publishedSlug, setPublishedSlug] = useState('')
  const [error, setError]                 = useState('')
  const [fbError, setFbError]             = useState('')
  const [fbSuccess, setFbSuccess]         = useState('')

  const [competition, setCompetition]     = useState(
    COMPETITION_OPTIONS.includes(meta.competition) ? meta.competition : 'AFL'
  )
  const [amateurGrade, setAmateurGrade]   = useState(meta.amateurGrade ?? '')
  const [sawflGrade, setSawflGrade]       = useState(meta.amateurGrade ?? '')
  const [sanflGrade, setSanflGrade]       = useState(meta.sanflGrade ?? '')
  const [countryLeague, setCountryLeague] = useState(meta.detectedCountryLeague ?? '')
  const [author, setAuthor]               = useState(AUTHORS[Math.floor(Math.random() * AUTHORS.length)])

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    editorProps: {
      attributes: {
        style: 'min-height:200px;outline:none;font-family:Barlow,sans-serif;font-size:0.9rem;line-height:1.75;color:#111;padding:0',
      },
    },
  })

  async function generate() {
    setGenerating(true); setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: kb.knowledge, contentType: 'Magazine match report', matchId: kb.matchId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setGenerated(data.content)
      if (editor) editor.commands.setContent(markdownToHtml(data.content))
    } catch (e: any) { setError(e.message) }
    setGenerating(false)
  }

  async function publishToWeb(): Promise<string | null> {
    setPublishing(true); setError('')
    const content = editor ? editor.getHTML() : generated
    const title = meta.venue ? `${homeTeam} v ${awayTeam} @ ${meta.venue}` : `${homeTeam} v ${awayTeam}`
    const slug  = slugify(`${homeTeam} v ${awayTeam} ${meta.date?.slice(0, 10) ?? ''}`)
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, slug, competition,
          contentText: content, author,
          countryLeague: competition === 'Country Football' ? countryLeague : null,
          amateurGrade:  competition === 'Amateur' ? amateurGrade : competition === "SAWFL Women's" ? sawflGrade : null,
          sanflGrade:    competition === 'SANFL' ? sanflGrade : null,
          homeTeam, awayTeam,
          homeScore: meta.homeScoreFormatted ?? String(meta.homeScore),
          awayScore: meta.awayScoreFormatted ?? String(meta.awayScore),
          matchDate: meta.date, venue: meta.venue, asDraft: false,
        }),
      })
      const data = await res.json()
      if (data.success) { setPublishedSlug(data.slug); return data.slug }
      else throw new Error(data.error ?? 'Publish failed')
    } catch (e: any) { setError(e.message); return null }
    finally { setPublishing(false) }
  }

  async function publishToFacebook(slug?: string) {
    setFbLoading(true); setFbError(''); setFbSuccess('')
    const content = editor ? editor.getHTML() : generated
    const plain = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    const liveUrl = slug ? `https://www.safootballer.com.au/match-results/${slug}` : ''
    try {
      const res = await fetch('/api/publish-facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: plain.slice(0, 900), link: liveUrl }),
      })
      const data = await res.json()
      if (data.success) setFbSuccess('Posted to Facebook!')
      else throw new Error(data.error ?? 'Facebook post failed')
    } catch (e: any) { setFbError(e.message) }
    setFbLoading(false)
  }

  async function publishBoth() {
    const slug = await publishToWeb()
    if (slug) await publishToFacebook(slug)
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    marginBottom: '0.3rem', display: 'block',
  }

  return (
    <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #2ca3ee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#e6fe00' }}>
            {homeTeam} vs {awayTeam}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
            {meta.date?.slice(0, 10)} · {meta.venue} · {meta.competition}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#2ca3ee', fontWeight: 700, marginTop: 4 }}>
            {meta.homeScoreFormatted ?? meta.homeScore} — {meta.awayScoreFormatted ?? meta.awayScore}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {!generated ? (
            <button onClick={generate} disabled={generating} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>
              {generating ? '⏳ Generating...' : '✨ Generate Report'}
            </button>
          ) : (
            <>
              <button onClick={generate} disabled={generating} style={{
                background: 'transparent', border: '1px solid rgba(44,163,238,0.4)',
                color: '#2ca3ee', borderRadius: 8, padding: '0.5rem 1rem',
                fontSize: '0.8rem', cursor: 'pointer',
              }}>
                {generating ? '⏳' : '🔄 Regenerate'}
              </button>
              {!publishedSlug ? (
                <>
                  <button onClick={publishToWeb} disabled={publishing || fbLoading} className="btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}>
                    {publishing ? '⏳' : '🌐 Web'}
                  </button>
                  <button onClick={() => publishToFacebook()} disabled={fbLoading || publishing} style={{
                    background: '#1877F2', color: '#fff', border: 'none', borderRadius: 8,
                    padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                  }}>
                    {fbLoading ? '⏳' : '📘 Facebook'}
                  </button>
                  <button onClick={publishBoth} disabled={publishing || fbLoading} style={{
                    background: '#e6fe00', color: '#000', border: 'none', borderRadius: 8,
                    padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                  }}>
                    {publishing || fbLoading ? '⏳' : '🚀 Both'}
                  </button>
                </>
              ) : (
                <a href={`https://www.safootballer.com.au/match-results/${publishedSlug}`} target="_blank" rel="noreferrer"
                  style={{ background: '#4ade80', color: '#000', borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                  ✅ Live!
                </a>
              )}
            </>
          )}
        </div>
      </div>

      {error    && <div className="alert-error" style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>{error}</div>}
      {fbError  && <div className="alert-error" style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>Facebook: {fbError}</div>}
      {fbSuccess && <div style={{ marginBottom: '0.75rem', fontSize: '0.82rem', background: '#f0fdf4', border: '1px solid #4ade80', color: '#166534', padding: '0.5rem 0.75rem', borderRadius: 8 }}>{fbSuccess}</div>}

      {generated && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ flex: '1 1 160px' }}>
            <label style={labelStyle}>Competition</label>
            <select value={competition} onChange={e => setCompetition(e.target.value)} className="input-field" style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}>
              {COMPETITION_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {competition === 'SANFL' && (
            <div style={{ flex: '1 1 140px' }}>
              <label style={labelStyle}>SANFL Grade {meta.sanflGrade && <span style={{ color: '#4ade80' }}>✅</span>}</label>
              <select value={sanflGrade} onChange={e => setSanflGrade(e.target.value)} className="input-field" style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}>
                <option value="">— Select —</option>
                {Object.entries(SANFL_GRADES).map(([n, v]) => <option key={v} value={v}>{n}</option>)}
              </select>
            </div>
          )}
          {competition === 'Amateur' && (
            <div style={{ flex: '1 1 160px' }}>
              <label style={labelStyle}>Amateur Grade {meta.amateurGrade && <span style={{ color: '#4ade80' }}>✅</span>}</label>
              <select value={amateurGrade} onChange={e => setAmateurGrade(e.target.value)} className="input-field" style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}>
                <option value="">— Select —</option>
                {Object.entries(AMATEUR_GRADES).map(([n, v]) => <option key={v} value={v}>{n}</option>)}
              </select>
            </div>
          )}
          {competition === "SAWFL Women's" && (
            <div style={{ flex: '1 1 160px' }}>
              <label style={labelStyle}>SAWFL Grade {meta.amateurGrade && <span style={{ color: '#4ade80' }}>✅</span>}</label>
              <select value={sawflGrade} onChange={e => setSawflGrade(e.target.value)} className="input-field" style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}>
                <option value="">— Select —</option>
                {Object.entries(SAWFL_GRADES).map(([n, v]) => <option key={v} value={v}>{n}</option>)}
              </select>
            </div>
          )}
          {competition === 'Country Football' && (
            <div style={{ flex: '1 1 160px' }}>
              <label style={labelStyle}>Country League</label>
              <select value={countryLeague} onChange={e => setCountryLeague(e.target.value)} className="input-field" style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}>
                <option value="">— Select —</option>
                {Object.entries(COUNTRY_LEAGUES).map(([n, v]) => <option key={v} value={v}>{n}</option>)}
              </select>
            </div>
          )}
          <div style={{ flex: '1 1 140px' }}>
            <label style={labelStyle}>Author</label>
            <select value={author} onChange={e => setAuthor(e.target.value)} className="input-field" style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}>
              {AUTHORS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
      )}

      {generated && editor && (
        <div style={{ background: '#fff', border: '1.5px solid rgba(44,163,238,0.3)', borderRadius: 10, padding: '1rem 1.25rem' }}>
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  )
}

// ── Batch publish step ─────────────────────────────────────────────────────────
export function BatchPublishStep({ kbResults }: { kbResults: KBResult[] }) {
  return (
    <section className="fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <SectionHeading step={3} title={`Generate & Publish — ${kbResults.length} Matches`} />
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
          Generate and review each report individually, then publish
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {kbResults.map(kb => (
          <MatchCard key={kb.matchId} kb={kb} />
        ))}
      </div>
    </section>
  )
}