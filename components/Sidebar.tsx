'use client'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

export function Sidebar({ user }: { user: any }) {
  const [matchCount, setMatchCount] = useState<number | null>(null)
  const [hasKB, setHasKB]           = useState(false)
  const [hasContent, setHasContent] = useState(false)

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(d => setMatchCount(d.total ?? 0))
      .catch(() => setMatchCount(0))

    const onKB      = () => setHasKB(true)
    const onContent = () => setHasContent(true)
    const onReset   = () => { setHasKB(false); setHasContent(false) }
    window.addEventListener('safie:kb-ready', onKB)
    window.addEventListener('safie:content-ready', onContent)
    window.addEventListener('safie:reset', onReset)
    return () => {
      window.removeEventListener('safie:kb-ready', onKB)
      window.removeEventListener('safie:content-ready', onContent)
      window.removeEventListener('safie:reset', onReset)
    }
  }, [])

  return (
    <aside style={{
      width: 260,
      flexShrink: 0,
      background: '#000',
      borderRight: '1px solid rgba(44,163,238,0.2)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      gap: '0.5rem',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>

      {/* Brand */}
      <div style={{ textAlign: 'center', padding: '0.5rem 0 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <img src="/logo2.png" alt="SAFie" style={{ height: 36 }}
            onError={e => (e.currentTarget.style.display='none')} />
          <img src="/logo.png" alt="SA Footballer" style={{ height: 36 }}
            onError={e => (e.currentTarget.style.display='none')} />
        </div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900, fontSize: '1.4rem',
          color: '#2ca3ee', letterSpacing: '-0.01em',
        }}>SAFie</div>
        <span className="badge-yellow" style={{ fontSize: '0.6rem', marginTop: 4, display: 'inline-block' }}>
          AI by SA Footballer
        </span>
      </div>

      <div style={{ height: 1, background: 'rgba(44,163,238,0.2)', margin: '0.25rem 0' }} />

      {/* User */}
      <div style={{
        padding: '0.75rem',
        borderRadius: 12,
        background: 'rgba(44,163,238,0.05)',
        border: '1px solid rgba(44,163,238,0.15)',
      }}>
        <div style={{
          fontSize: '0.68rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: '0.4rem',
        }}>👤 Signed in as</div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
          {user?.name ?? '—'}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#2ca3ee', marginTop: 2 }}>
          {(user?.role ?? 'user').toUpperCase()}
        </div>
      </div>

      {/* Match count */}
      <div className="metric-card">
        <div className="metric-label">Available Matches</div>
        <div className="metric-value">{matchCount ?? '…'}</div>
      </div>

      {/* Status */}
      {hasKB
        ? <div className="alert-success" style={{ fontSize: '0.8rem', padding: '0.6rem 0.875rem' }}>✅ Knowledge Base Active</div>
        : <div className="alert-info"    style={{ fontSize: '0.8rem', padding: '0.6rem 0.875rem' }}>ℹ️ Select a match to begin</div>
      }
      {hasContent && (
        <div className="alert-success" style={{ fontSize: '0.8rem', padding: '0.6rem 0.875rem' }}>
          ✅ Content Ready to Publish
        </div>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ height: 1, background: 'rgba(44,163,238,0.2)', margin: '0.25rem 0' }} />

      {/* Quick guide */}
      <div style={{ padding: '0.5rem 0.25rem' }}>
        <div style={{
          fontSize: '0.68rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: '0.75rem',
        }}>📚 Quick Guide</div>
        {[
          ['Select',   'matches from dropdown'],
          ['Build',    'knowledge base'],
          ['Generate', 'content'],
          ['Publish',  'live to website'],
        ].map(([bold, rest], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <span className="step-badge" style={{ width: 20, height: 20, fontSize: '0.7rem', flexShrink: 0, marginTop: 2 }}>
              {i + 1}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
              <strong style={{ color: '#e6fe00' }}>{bold}</strong> {rest}
            </span>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="btn-yellow"
        style={{ width: '100%', fontSize: '0.85rem', padding: '0.7rem' }}
      >
        🚪 Logout
      </button>

    </aside>
  )
}