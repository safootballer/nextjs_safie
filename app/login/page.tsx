'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) { setError('Please enter both username and password'); return }
    setLoading(true); setError('')
    const res = await signIn('credentials', { username, password, redirect: false })
    setLoading(false)
    if (res?.ok) router.push('/dashboard')
    else setError('Invalid username or password')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: '800px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(44,163,238,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logos + brand */}
      <div className="fade-up" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <img src="/logo2.png" alt="SAFie" style={{ height: 56 }} onError={e => (e.currentTarget.style.display='none')} />
          <img src="/logo.png"  alt="SA Footballer" style={{ height: 56 }} onError={e => (e.currentTarget.style.display='none')} />
        </div>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900, fontSize: '3.5rem', letterSpacing: '-0.02em',
          color: '#2ca3ee', lineHeight: 1, margin: 0,
        }}>SAFie</h1>
        <div style={{ marginTop: '0.4rem' }}>
          <span className="badge-yellow">AI by SA Footballer</span>
        </div>
        <p style={{ marginTop: '0.6rem', color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem' }}>
          AI-Powered Match Report Generation
        </p>
      </div>

      {/* Login card */}
      <div className="fade-up-1 glass-card" style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800, fontSize: '1.5rem', letterSpacing: '0.04em',
          textTransform: 'uppercase', color: '#fff', marginBottom: '0.25rem',
        }}>🔐 Welcome Back</h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
          Sign in to generate professional match reports
        </p>

        {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>❌ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block', fontSize: '0.75rem', fontWeight: 700,
              color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username" className="input-field"
            />
          </div>
          <div>
            <label style={{
              display: 'block', fontSize: '0.75rem', fontWeight: 700,
              color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password" className="input-field"
            />
          </div>
          <button
            type="submit" disabled={loading} className="btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.9rem' }}
          >
            {loading ? '⏳ Signing in…' : '🚀 Sign In'}
          </button>
        </form>
      </div>

      {/* Feature cards */}
      <div className="fade-up-2" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        gap: '1rem', width: '100%', maxWidth: 480, marginTop: '2rem',
      }}>
        {[
          { icon: '⚡', title: 'Fast',         desc: 'Reports in seconds' },
          { icon: '🎯', title: 'Accurate',     desc: 'AI-powered precision' },
          { icon: '✍️', title: 'Professional', desc: 'Magazine quality' },
        ].map(f => (
          <div key={f.title} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', borderBottom: '3px solid #e6fe00' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{f.icon}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: '#2ca3ee', fontSize: '0.95rem' }}>{f.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.2rem' }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="fade-up-3" style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
        <span style={{ color: '#2ca3ee', fontWeight: 700 }}>SAFie</span>
        {' · '}
        <span style={{ color: '#e6fe00', fontWeight: 600 }}>AI by SA Footballer</span>
        {' · '}
        © 2026 The South Australian Footballer
      </div>
    </div>
  )
}