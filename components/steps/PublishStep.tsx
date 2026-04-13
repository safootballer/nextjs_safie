'use client'
import { useState, useEffect } from 'react'
import { SectionHeading } from './MatchSelectStep'
import { slugify } from '@/lib/publishers'
import { AUTHORS, COMPETITION_MAP, COUNTRY_LEAGUES, PLAYHQ_TO_COUNTRY_LEAGUE } from '@/lib/constants'

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
  // Auto-derive title from first non-empty line
  const firstLine = content.split('\n').map(l => l.trim()).find(l => l.length > 5) ?? ''
  const cleanTitle = firstLine.replace(/^#+\s*/, '').replace(/\*+/g, '').slice(0, 120)

  const [title, setTitle]             = useState(cleanTitle)
  const [slug, setSlug]               = useState(slugify(cleanTitle))
  const [excerpt, setExcerpt]         = useState('')
  const [author, setAuthor]           = useState(AUTHORS[0])
  const [competition, setCompetition] = useState('AFL')
  const [countryLeague, setCountryLeague] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  // Auto-fill excerpt from content
  useEffect(() => {
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
    const ex = lines.find(l => l.length > 80 && !l.startsWith('#') && !l.startsWith('**') && !l.startsWith('|'))
    setExcerpt((ex ?? lines[0] ?? '').slice(0, 300))
  }, [content])

  // Auto-detect competition from meta
  useEffect(() => {
    if (!meta) return
    const rawComp = meta.competition ?? 'AFL'
    if (meta.isCountryFootball) {
      setCompetition('Country Football')
      setCountryLeague(meta.detectedCountryLeague ?? '')
    } else {
      const mapped = COMPETITION_MAP[rawComp] ?? 'AFL'
      setCompetition(COMPETITION_OPTIONS.includes(mapped) ? mapped : 'AFL')
    }
  }, [meta])

  // Auto-slug from title
  useEffect(() => { setSlug(slugify(title)) }, [title])

  const ready = Boolean(title && slug && excerpt)

  async function publish(asDraft: boolean) {
    setLoading(true); setError('')
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, slug, competition, excerpt, contentText: content,
        author, countryLeague: competition === 'Country Football' ? countryLeague : null,
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

  return (
    <section>
      <SectionHeading step={4} title="Publish to SA Footballer Website" />

      {publishedSlug && (
        <div className="rounded-lg px-4 py-3 text-sm mb-4 font-semibold" style={{ background: '#052e16', color: '#4ade80', border: '1px solid #4ade80' }}>
          🎉 Article is LIVE! View at:{' '}
          <a href={`https://sa-footballer-website.vercel.app/editorials/${publishedSlug}`} target="_blank" rel="noreferrer" className="underline">
            sa-footballer-website.vercel.app/editorials/{publishedSlug}
          </a>
        </div>
      )}

      <div className="rounded-xl p-4 mb-5 text-sm" style={{ background: '#000', borderLeft: '5px solid #e6fe00' }}>
        Fill in the details below and hit <strong style={{ color: '#e6fe00' }}>Publish Live</strong> — your article will appear on the Editorials page immediately.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <Field label="Article Title *">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Glenelg Dominate in 45-Point Victory Over Sturt"
              className="w-full rounded-lg border-2 px-4 py-3 text-black text-sm outline-none"
              style={{ borderColor: '#2ca3ee' }} />
          </Field>

          <Field label="Slug (URL path) *" hint="Auto-generated from title">
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
              className="w-full rounded-lg border-2 px-4 py-3 text-black text-sm outline-none font-mono"
              style={{ borderColor: '#2ca3ee' }} />
          </Field>

          <Field label="Excerpt * (shown on editorial cards)">
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={4}
              className="w-full rounded-lg border-2 px-4 py-3 text-black text-sm outline-none"
              style={{ borderColor: '#2ca3ee' }} />
          </Field>

          <Field label="Author">
            <select value={author} onChange={e => setAuthor(e.target.value)}
              className="w-full rounded-lg border-2 px-4 py-3 text-black text-sm outline-none"
              style={{ borderColor: '#2ca3ee' }}>
              {AUTHORS.map(a => <option key={a}>{a}</option>)}
            </select>
          </Field>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Field label="Competition *">
            <select value={competition} onChange={e => setCompetition(e.target.value)}
              className="w-full rounded-lg border-2 px-4 py-3 text-black text-sm outline-none"
              style={{ borderColor: '#2ca3ee' }}>
              {COMPETITION_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>

          {competition === 'Country Football' && (
            <Field label="Country League *">
              <select value={countryLeague} onChange={e => setCountryLeague(e.target.value)}
                className="w-full rounded-lg border-2 px-4 py-3 text-black text-sm outline-none"
                style={{ borderColor: '#2ca3ee' }}>
                {Object.entries(COUNTRY_LEAGUES).map(([name, val]) => (
                  <option key={val} value={val}>{name}</option>
                ))}
              </select>
            </Field>
          )}

          {!ready && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#2d1a00', border: '1px solid #fbbf24', color: '#fbbf24' }}>
              ⚠️ Fill in Title, Slug and Excerpt to enable publishing.
            </div>
          )}

          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#2d0000', border: '1px solid #f87171', color: '#f87171' }}>
              ❌ {error}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={() => publish(false)}
              disabled={!ready || loading}
              className="w-full rounded-lg py-3 font-bold text-white text-sm transition-all"
              style={{ background: (!ready || loading) ? '#555' : 'linear-gradient(90deg,#2ca3ee,#00b8f1)' }}
            >
              {loading ? '📡 Publishing…' : '🚀 Publish Live Now'}
            </button>
            <button
              onClick={() => publish(true)}
              disabled={!title || loading}
              className="w-full rounded-lg py-3 font-bold text-black text-sm transition-all"
              style={{ background: !title ? '#888' : '#e6fe00' }}
            >
              💾 Save as Draft
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">
        {label}
        {hint && <span className="ml-2 text-xs opacity-50 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  )
}
