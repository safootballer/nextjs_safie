'use client'
import { MatchLink } from '@/app/dashboard/page'

interface Props {
  grouped: Record<string, MatchLink[]>
  matches: MatchLink[]
  loading: boolean
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export function MatchSelectStep({ grouped, matches, loading, selectedIds, onSelectionChange }: Props) {
  function toggle(id: string) {
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]
    )
  }

  return (
    <section>
      <SectionHeading step={1} title="Select Matches" />

      {loading && <p className="text-sm opacity-60 mt-4">Loading matches…</p>}

      {!loading && matches.length === 0 && (
        <div className="rounded-2xl p-8 text-center mt-4" style={{ background: '#000', border: '2px solid #2ca3ee' }}>
          <h3 className="text-lg font-bold" style={{ color: '#e6fe00' }}>📭 No Matches Available Yet</h3>
          <p className="text-sm mt-2 opacity-75">Your admin team hasn't added this week's matches yet. Check back soon!</p>
        </div>
      )}

      {!loading && matches.length > 0 && (
        <>
          <p className="text-sm font-semibold mt-4 mb-3">Select one or more matches to generate content for:</p>

          {/* Selected chips */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedIds.map(id => {
                const m = matches.find(x => x.match_id === id)!
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer"
                    style={{ background: '#2ca3ee', color: '#fff' }}
                    onClick={() => toggle(id)}
                  >
                    ✅ {m.home_team} vs {m.away_team}
                    <span className="ml-1 opacity-70">✕</span>
                  </span>
                )
              })}
            </div>
          )}

          {/* Competition groups */}
          {Object.entries(grouped).map(([comp, compMatches]) => (
            <div key={comp} className="mb-6">
              <p className="text-sm font-black uppercase mb-3 pb-1" style={{ color: '#2ca3ee', borderBottom: '3px solid #2ca3ee', letterSpacing: '0.04em' }}>
                🏆 {comp}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {compMatches.map(m => {
                  const selected = selectedIds.includes(m.match_id)
                  return (
                    <div
                      key={m.match_id}
                      onClick={() => toggle(m.match_id)}
                      className="rounded-xl p-4 cursor-pointer transition-all"
                      style={{
                        background: selected ? 'rgba(44,163,238,0.15)' : '#000',
                        border: selected ? '2px solid #2ca3ee' : '1px solid rgba(44,163,238,0.4)',
                      }}
                    >
                      <p className="font-bold text-sm">{m.home_team}</p>
                      <p className="text-xs my-1" style={{ color: '#2ca3ee' }}>vs</p>
                      <p className="font-bold text-sm">{m.away_team}</p>
                      <hr className="my-2" style={{ borderColor: '#2ca3ee', opacity: 0.2 }} />
                      <p className="text-xs opacity-60">📅 {m.date?.slice(0, 10) ?? 'TBD'}</p>
                      <p className="text-xs opacity-60">📍 {m.venue ?? 'TBD'}</p>
                      {selected && (
                        <p className="text-xs font-bold mt-2" style={{ color: '#e6fe00' }}>✓ Selected</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {selectedIds.length === 0 && (
            <p className="text-sm opacity-60 mt-2">👆 Click matches above to select them, then scroll down to build the knowledge base.</p>
          )}
        </>
      )}
    </section>
  )
}

export function SectionHeading({ step, title }: { step: number; title: string }) {
  return (
    <h2 className="text-2xl font-black pb-2 mb-4" style={{ color: '#2ca3ee', borderBottom: '3px solid #2ca3ee' }}>
      {step === 1 ? '🏈' : step === 2 ? '🧠' : step === 3 ? '✍️' : '🚀'} Step {step}: {title}
    </h2>
  )
}
