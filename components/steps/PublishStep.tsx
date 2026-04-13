'use client'
import { useState, useEffect } from 'react'
import { SectionHeading } from './MatchSelectStep'
import { slugify } from '@/lib/publishers'
import { AUTHORS, COMPETITION_MAP, COUNTRY_LEAGUES } from '@/lib/constants'

const COMPETITION_OPTIONS = ['AFL', 'AFLW', 'SANFL', 'SANFLW', 'Amateur', "SAWFL Women's", 'Country Football']

interface Meta {
  competition: string
  detectedCountryLeague: string | null
  isCountryFootball: boolean
}
interface Props {
  content: string
  contentType: string
  meta?: Meta
  publishedSlug: string
  onPublished: (slug: string) => void
}

export function PublishStep({ content, contentType, meta, publishedSlug, onPublished }: Props) {
  const cleanTitle = (content.split('\n').map(l => l.trim()).find(l => l.length > 5) ?? '')
    .replace(/^#+\s*/, '').replace(/\*+/g, '').slice(0, 120)

  const [title, setTitle]                     = useState(cleanTitle)
  const [slug, setSlug]                       = useState(slugify(cleanTitle))
  const [excerpt, setExcerpt]                 = useState('')
  const [author, setAuthor]                   = useState(AUTHORS[0])
  const [competition, setCompetition]         = useState('AFL')
  const [countryLeague, setCountryLeague]     = useState('')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState('')

  useEffect(() => {
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
    const ex = lines.find(l => l.length > 80 && !l.startsWith('#') && !l.startsWith('**') && !l.startsWith('|'))
    setExcerpt((ex ?? lines[0] ?? '').slice(0, 300))
  }, [content])

  useEffect(() => {
    if (!meta) return
    if (meta.isCountryFootball) {
      setCompetition('Country Football')
      setCountryLeague(meta.detectedCountryLeague ?? '')
    } else {
      const m = COMPETITION_MAP[meta.competition] ?? 'AFL'
      setCompetition(COMPETITION_OPTIONS.includes(m) ? m : 'AFL')
    }
  }, [meta])

  useEffect(() => { setSlug(slugify(title)) }, [title])

  const ready = Boolean(title && slug && excerpt)

  async function publish(asDraft: boolean) {
    setLoading(true); setError('')
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, slug, competition, excerpt,
        contentText: content, author,
        countryLeague: competition === 'Country Football' ? countryLeague : null,
        asDraft,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) {
      if (!asDraft) onPublished(data.slug)
      else alert('💾 Draft saved in Sanity Studio!')
    } else {
      setError(data.error ?? 'Publish failed')
    }
  }

  const labelStyle = {
    fontSize: '0.75rem' as const,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '0.4rem',
    display: 'block' as const,
  }

  return (
    <section className="fade-up">
      <SectionHeading step={4} title="Publish to Website" />

      {publishedSlug && (
        <div className="alert-success" style={{ marginBottom: '1.25rem' }}>
          🎉 Article is LIVE!{' '}
          
            href={`https://sa-footballer-website.vercel.app/editorials/${publishedSlug}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#4ade80', textDecoration: 'underline' }}
          >
              {'View article →'}
          </a>
          </div>
            )}

      <div className="alert-info" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #e6fe00' }}>
        Fill in the details below and hit{' '}
        <strong style={{ color: '#e6fe00' }}>Publish Live</strong>{' '}
        — appears on the website immediately.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Article Title *</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Glenelg Dominate in 45-Point Victory"
              className="input-field"
            />
          </div>
          <div>
            <label style={labelStyle}>Slug (URL path) *</label>
            <input
              type="text" value={slug} onChange={e => setSlug(e.target.value)}
              className="input-field"
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Excerpt *</label>
            <textarea
              value={excerpt} onChange={e => setExcerpt(e.target.value)}
              rows={3} className="input-field"
            />
          </div>
          <div>
            <label style={labelStyle}>Author</label>
            <select value={author} onChange={e => setAuthor(e.target.value)} className="input-field">
              {AUTHORS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Competition *</label>
            <select value={competition} onChange={e => setCompetition(e.target.value)} className="input-field">
              {COMPETITION_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {competition === 'Country Football' && (
            <div>
              <label style={labelStyle}>Country League *</label>
              <select value={countryLeague} onChange={e => setCountryLeague(e.target.value)} className="input-field">
                {Object.entries(COUNTRY_LEAGUES).map(([name, val]) => (
                  <option key={val} value={val}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {!ready && (
            <div className="alert-warning">⚠️ Fill in Title, Slug and Excerpt to publish.</div>
          )}
          {error && (
            <div className="alert-error">❌ {error}</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
            <button
              onClick={() => publish(false)}
              disabled={!ready || loading}
              className="btn-primary"
              style={{ width: '100%', padding: '0.9rem' }}
            >
              {loading ? '📡 Publishing…' : '🚀 Publish Live Now'}
            </button>
            <button
              onClick={() => publish(true)}
              disabled={!title || loading}
              className="btn-yellow"
              style={{ width: '100%', padding: '0.9rem' }}
            >
              💾 Save as Draft
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}