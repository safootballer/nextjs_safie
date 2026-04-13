'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black" style={{ color: '#2ca3ee' }}>SAFie</h1>
        <p className="mt-1 text-sm font-bold tracking-widest uppercase" style={{ color: '#e6fe00' }}>
          AI by SA Footballer
        </p>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
          AI-Powered Match Report Generation
        </p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl" style={{ borderTop: '5px solid #2ca3ee' }}>
        <h2 className="text-2xl font-bold text-black mb-1">🔐 Welcome Back</h2>
        <p className="text-sm text-gray-500 mb-6">Sign in to generate professional match reports</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-1">👤 Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full rounded-lg border-2 px-4 py-3 text-black text-sm outline-none transition"
              style={{ borderColor: '#2ca3ee' }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1">🔒 Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border-2 px-4 py-3 text-black text-sm outline-none transition"
              style={{ borderColor: '#2ca3ee' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-3 font-bold text-white text-sm transition-all"
            style={{ background: loading ? '#aaa' : 'linear-gradient(90deg,#2ca3ee,#00b8f1)' }}
          >
            {loading ? '⏳ Signing in…' : '🚀 Sign In'}
          </button>
        </form>
      </div>

      {/* Feature cards */}
      <div className="mt-10 grid grid-cols-3 gap-4 w-full max-w-2xl">
        {[
          { icon: '⚡', title: 'Fast', desc: 'Generate reports in seconds' },
          { icon: '🎯', title: 'Accurate', desc: 'Powered by AI technology' },
          { icon: '✍️', title: 'Professional', desc: 'Magazine-quality content' },
        ].map(f => (
          <div key={f.title} className="rounded-xl bg-white p-5 text-center shadow-lg" style={{ borderBottom: '4px solid #e6fe00' }}>
            <div className="text-3xl mb-2">{f.icon}</div>
            <h4 className="font-bold text-sm" style={{ color: '#2ca3ee' }}>{f.title}</h4>
            <p className="text-xs text-gray-600 mt-1">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 w-full max-w-2xl rounded-xl px-6 py-4 text-center text-xs" style={{ background: '#000', borderTop: '3px solid #2ca3ee' }}>
        <span style={{ color: '#2ca3ee', fontWeight: 700 }}>SAFie</span>
        {' · '}
        <span style={{ color: '#e6fe00', fontWeight: 600 }}>AI by SA Footballer</span>
        {' · '}
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>© 2026 The South Australian Footballer. All rights reserved.</span>
      </div>
    </div>
  )
}
