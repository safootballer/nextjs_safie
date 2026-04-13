'use client'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface SidebarProps {
  user: { name?: string | null; role?: string }
}

export function Sidebar({ user }: SidebarProps) {
  const [matchCount, setMatchCount] = useState<number | null>(null)
  const [hasKB, setHasKB]           = useState(false)
  const [hasContent, setHasContent] = useState(false)

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(d => setMatchCount(d.total ?? 0))
      .catch(() => setMatchCount(0))

    // Listen for custom events from dashboard
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
    <aside
      className="w-64 flex-shrink-0 flex flex-col py-6 px-4 gap-4"
      style={{ background: '#000', borderRight: '3px solid #2ca3ee', minHeight: '100vh' }}
    >
      {/* Logos */}
      <div className="flex justify-center gap-4 mb-2">
        <img src="/logo2.png" alt="SAFie" width={60} onError={e => (e.currentTarget.style.display='none')} />
        <img src="/logo.png"  alt="SA Footballer" width={60} onError={e => (e.currentTarget.style.display='none')} />
      </div>

      {/* Brand */}
      <div className="text-center">
        <span className="block text-lg font-black" style={{ color: '#2ca3ee' }}>SAFie</span>
        <span className="block text-xs font-bold tracking-widest uppercase" style={{ color: '#e6fe00' }}>
          AI BY SA FOOTBALLER
        </span>
      </div>

      <hr style={{ borderColor: '#2ca3ee', opacity: 0.35 }} />

      {/* User */}
      <div>
        <p className="text-xs font-bold uppercase mb-2" style={{ color: '#2ca3ee', borderBottom: '2px solid #2ca3ee', paddingBottom: 4 }}>
          👤 User Profile
        </p>
        <p className="text-sm text-white"><span className="opacity-60">Name:</span> {user?.name ?? '—'}</p>
        <p className="text-sm text-white mt-1"><span className="opacity-60">Role:</span> {((user as any)?.role ?? 'user').toUpperCase()}</p>
      </div>

      <hr style={{ borderColor: '#2ca3ee', opacity: 0.35 }} />

      {/* Stats */}
      <div className="rounded-lg p-3" style={{ background: '#1a1a1a', border: '1px solid #2ca3ee' }}>
        <p className="text-xs opacity-60 mb-1">📊 Available Matches</p>
        <p className="text-2xl font-black" style={{ color: '#e6fe00' }}>{matchCount ?? '…'}</p>
      </div>

      {hasKB
        ? <div className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: '#052e16', color: '#4ade80', border: '1px solid #4ade80' }}>✅ Knowledge Base Active</div>
        : <div className="rounded-lg px-3 py-2 text-sm" style={{ background: '#0c1a2e', color: '#93c5fd', border: '1px solid #2ca3ee' }}>ℹ️ Select a match to begin</div>
      }

      {hasContent && (
        <div className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: '#052e16', color: '#4ade80', border: '1px solid #4ade80' }}>
          ✅ Content Ready to Publish
        </div>
      )}

      <hr style={{ borderColor: '#2ca3ee', opacity: 0.35 }} />

      {/* Logout */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="w-full rounded-lg py-2 text-sm font-bold transition"
        style={{ background: '#e6fe00', color: '#000' }}
      >
        🚪 Logout
      </button>

      <hr style={{ borderColor: '#2ca3ee', opacity: 0.35 }} />

      {/* Quick guide */}
      <div>
        <p className="text-xs font-bold uppercase mb-2" style={{ color: '#2ca3ee', borderBottom: '2px solid #2ca3ee', paddingBottom: 4 }}>
          📚 Quick Guide
        </p>
        <ol className="text-sm space-y-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
          {[
            ['Select', 'matches from dropdown'],
            ['Build', 'knowledge base'],
            ['Generate', 'content'],
            ['Publish', 'live to website'],
          ].map(([bold, rest], i) => (
            <li key={i}>
              <span className="font-bold" style={{ color: '#e6fe00' }}>{i + 1}. {bold}</span> {rest}
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}
