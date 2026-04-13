'use client'
import { useState } from 'react'
import { MatchLink, KBResult } from '@/app/dashboard/page'
import { SectionHeading } from './MatchSelectStep'

interface Props {
  selectedIds: string[]
  matches: MatchLink[]
  onReady: (results: KBResult[]) => void
}

export function KnowledgeStep({ selectedIds, matches, onReady }: Props) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<KBResult[]>([])
  const [errors, setErrors]   = useState<string[]>([])
  const [done, setDone]       = useState(false)

  const selectedMatches = selectedIds
    .map(id => matches.find(m => m.match_id === id)!)
    .filter(Boolean)

  async function build() {
    setLoading(true); setErrors([]); setResults([]); setDone(false)
    try {
      const res  = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchIds: selectedIds }),
      })
      const data = await res.json()
      setResults(data.results ?? [])
      setErrors(data.errors ?? [])
      if ((data.results ?? []).length > 0) {
        setDone(true)
        onReady(data.results)
      }
    } catch (e: any) {
      setErrors([e.message])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="fade-up">
      <SectionHeading step={2} title="Build Knowledge Base" />

      {/* Selected match preview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '0.875rem',
        marginBottom: '1.75rem',
      }}>
        {selectedMatches.map(m => (
          <div key={m.match_id} className="glass-card" style={{ padding: '1rem 1.25rem', borderLeft: '3px solid #2ca3ee' }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, color: '#e6fe00',
              fontSize: '0.95rem', marginBottom: '0.4rem',
            }}>
              ✅ {m.home_team} vs {m.away_team}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
              📅 {m.date?.slice(0, 10) ?? 'TBD'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              📍 {m.venue ?? 'TBD'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#2ca3ee', marginTop: 2 }}>
              🏆 {m.competition}
            </div>
          </div>
        ))}
      </div>

      {/* Build button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <button onClick={build} disabled={loading} className="btn-primary" style={{ minWidth: 240 }}>
          {loading ? '🔄 Fetching from PlayHQ…' : '📥 Build Knowledge Base'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {results.map(r => (
            <details key={r.matchId} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <summary style={{
                padding: '0.875rem 1.25rem',
                cursor: 'pointer',
                fontWeight: 600,
                color: '#2ca3ee',
                fontSize: '0.9rem',
                listStyle: 'none',
              }}>
                ✅ {r.meta.homeTeam} vs {r.meta.awayTeam} — {r.meta.homeScore} : {r.meta.awayScore} ({r.meta.margin} pt margin)
              </summary>
              <div style={{
                padding: '0.875rem 1.25rem',
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                borderTop: '1px solid rgba(44,163,238,0.15)',
              }}>
                {[
                  ['Date',   r.meta.date],
                  ['Venue',  r.meta.venue],
                  ['Score',  `${r.meta.homeScore} – ${r.meta.awayScore}`],
                  ['Margin', `${r.meta.margin} pts`],
                ].map(([k, v]) => (
                  <p key={k} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                    <span style={{ opacity: 0.5 }}>{k}:</span> {v}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.map((e, i) => (
        <div key={i} className="alert-error" style={{ marginBottom: '0.5rem' }}>❌ {e}</div>
      ))}

      {/* Success */}
      {done && (
        <div className="alert-success">
          🎉 Knowledge base ready! {results.length} match(es) indexed. Scroll down to generate content.
        </div>
      )}
    </section>
  )
}