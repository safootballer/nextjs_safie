'use client'
import { useState } from 'react'
import { MatchLink } from '@/app/dashboard/page'

interface Props {
  grouped: Record<string, MatchLink[]>
  matches: MatchLink[]
  loading: boolean
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

function isWithinDays(dateStr: string | null, days: number): boolean {
  if (!dateStr) return false
  const matchDate = new Date(dateStr)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return matchDate >= cutoff
}

export function MatchSelectStep({ grouped, matches, loading, selectedIds, onSelectionChange }: Props) {
  const [openComp, setOpenComp] = useState<string | null>(null)

  function toggle(id: string) {
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id]
    )
  }

  function toggleComp(comp: string) {
    setOpenComp(prev => prev === comp ? null : comp)
  }

  const filteredGrouped: Record<string, MatchLink[]> = {}
  for (const [comp, compMatches] of Object.entries(grouped)) {
    const recent = compMatches.filter(m => isWithinDays(m.date, 3))
    if (recent.length > 0) filteredGrouped[comp] = recent
  }

  const emptyComps = Object.keys(grouped).filter(c => !filteredGrouped[c])

  return (
    <section className="fade-up">
      <SectionHeading step={1} title="Select Matches" />

      {loading && (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Loading matches...</p>
      )}

      {!loading && matches.length === 0 && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📭</div>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: '#e6fe00', fontSize: '1.2rem' }}>
            No Matches Available Yet
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Your admin team has not added this week's matches yet.
          </p>
        </div>
      )}

      {!loading && matches.length > 0 && (
        <>
          {selectedIds.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {selectedIds.map(id => {
                const m = matches.find(x => x.match_id === id)!
                return (
                  <span
                    key={id}
                    onClick={() => toggle(id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      background: 'rgba(44,163,238,0.15)', border: '1px solid #2ca3ee',
                      borderRadius: 20, padding: '4px 14px', fontSize: '0.8rem',
                      fontWeight: 600, color: '#fff', cursor: 'pointer',
                    }}
                  >
                    {m.home_team} vs {m.away_team}
                    <span style={{ color: '#2ca3ee', fontSize: '0.75rem' }}>x</span>
                  </span>
                )
              })}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(filteredGrouped).map(([comp, compMatches]) => {
              const isOpen = openComp === comp
              const selectedInComp = compMatches.filter(m => selectedIds.includes(m.match_id)).length
              return (
                <div key={comp} className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
                  <div
                    onClick={() => toggleComp(comp)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.875rem 1.25rem', cursor: 'pointer',
                      borderBottom: isOpen ? '1px solid rgba(44,163,238,0.2)' : 'none',
                      background: isOpen ? 'rgba(44,163,238,0.06)' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span>🏆</span>
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700, fontSize: '1rem',
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        color: isOpen ? '#2ca3ee' : '#fff',
                      }}>{comp}</span>
                      <span style={{
                        background: 'rgba(44,163,238,0.15)', border: '1px solid rgba(44,163,238,0.3)',
                        borderRadius: 20, padding: '2px 10px',
                        fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)',
                      }}>
                        {compMatches.length} match{compMatches.length !== 1 ? 'es' : ''}
                      </span>
                      {selectedInComp > 0 && (
                        <span style={{
                          background: 'rgba(230,254,0,0.15)', border: '1px solid #e6fe00',
                          borderRadius: 20, padding: '2px 10px',
                          fontSize: '0.72rem', color: '#e6fe00', fontWeight: 700,
                        }}>
                          {selectedInComp} selected
                        </span>
                      )}
                    </div>
                    <span style={{
                      color: '#2ca3ee', fontSize: '0.75rem', fontWeight: 700,
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s', display: 'inline-block',
                    }}>▼</span>
                  </div>

                  {isOpen && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '0.875rem',
                      padding: '1rem 1.25rem',
                    }}>
                      {compMatches.map(m => {
                        const selected = selectedIds.includes(m.match_id)
                        return (
                          <div
                            key={m.match_id}
                            className={`match-card ${selected ? 'selected' : ''}`}
                            onClick={() => toggle(m.match_id)}
                          >
                            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: 2 }}>
                              {m.home_team}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#2ca3ee', margin: '4px 0', fontWeight: 600 }}>vs</div>
                            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                              {m.away_team}
                            </div>
                            <div style={{ height: 1, background: 'rgba(44,163,238,0.15)', margin: '0.625rem 0' }} />
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                              📅 {m.date?.slice(0, 10) ?? 'TBD'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                              📍 {m.venue ?? 'TBD'}
                            </div>
                            {selected && (
                              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#e6fe00' }}>
                                Selected
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {emptyComps.map(comp => (
              <div key={comp} className="glass-card" style={{ padding: '0.875rem 1.25rem', opacity: 0.4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span>🏆</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {comp}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>No matches in last 3 days</span>
                </div>
              </div>
            ))}
          </div>

          {selectedIds.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '1rem' }}>
              Click a league to expand it, then select matches.
            </p>
          )}
        </>
      )}
    </section>
  )
}

export function SectionHeading({ step, title }: { step: number; title: string }) {
  const icons = ['🏈', '🧠', '✍️', '🚀']
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      marginBottom: '1.25rem', paddingBottom: '0.75rem',
      borderBottom: '1px solid rgba(44,163,238,0.2)',
    }}>
      <span className="step-badge">{step}</span>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 800, fontSize: '1.5rem',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        color: '#2ca3ee', margin: 0,
      }}>
        {icons[step - 1]} {title}
      </h2>
    </div>
  )
}