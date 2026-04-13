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
  const [loading, setLoading]   = useState(false)
  const [results, setResults]   = useState<KBResult[]>([])
  const [errors, setErrors]     = useState<string[]>([])
  const [done, setDone]         = useState(false)

  const selectedMatches = selectedIds.map(id => matches.find(m => m.match_id === id)!).filter(Boolean)

  async function build() {
    setLoading(true); setErrors([]); setResults([]); setDone(false)
    try {
      const res = await fetch('/api/knowledge-base', {
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
    <section>
      <SectionHeading step={2} title="Build Knowledge Base" />

      {/* Selected match preview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {selectedMatches.map(m => (
          <div key={m.match_id} className="rounded-xl p-4" style={{ background: '#000', border: '2px solid #2ca3ee' }}>
            <p className="font-bold text-sm" style={{ color: '#e6fe00' }}>✅ {m.home_team} vs {m.away_team}</p>
            <p className="text-xs mt-2 opacity-75">📅 {m.date?.slice(0, 10) ?? 'TBD'} · 📍 {m.venue ?? 'TBD'}</p>
            <p className="text-xs mt-1" style={{ color: '#2ca3ee' }}>🏆 {m.competition}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={build}
          disabled={loading}
          className="px-8 py-3 rounded-lg font-bold text-white text-sm transition-all"
          style={{ background: loading ? '#555' : 'linear-gradient(90deg,#2ca3ee,#00b8f1)' }}
        >
          {loading ? '🔄 Fetching from PlayHQ…' : '📥 Build Knowledge Base'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6 space-y-3">
          {results.map(r => (
            <details key={r.matchId} className="rounded-lg overflow-hidden" style={{ background: '#000', border: '1px solid #2ca3ee' }}>
              <summary className="px-4 py-3 cursor-pointer text-sm font-semibold" style={{ color: '#2ca3ee' }}>
                ✅ {r.meta.homeTeam} vs {r.meta.awayTeam} — {r.meta.homeScore} : {r.meta.awayScore} (margin {r.meta.margin} pts)
              </summary>
              <div className="px-4 pb-4 grid grid-cols-2 gap-2 text-sm">
                <p><span className="opacity-60">Date:</span> {r.meta.date}</p>
                <p><span className="opacity-60">Venue:</span> {r.meta.venue}</p>
                <p><span className="opacity-60">Score:</span> {r.meta.homeScore} – {r.meta.awayScore}</p>
                <p><span className="opacity-60">Margin:</span> {r.meta.margin} pts</p>
              </div>
            </details>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((e, i) => (
            <div key={i} className="rounded-lg px-4 py-3 text-sm" style={{ background: '#2d0000', border: '1px solid #f87171', color: '#f87171' }}>
              ❌ {e}
            </div>
          ))}
        </div>
      )}

      {done && (
        <div className="mt-4 rounded-lg px-4 py-3 text-sm font-semibold text-center" style={{ background: '#052e16', color: '#4ade80', border: '1px solid #4ade80' }}>
          🎉 Knowledge base ready! {results.length} match(es) indexed. Scroll down to generate content.
        </div>
      )}
    </section>
  )
}
