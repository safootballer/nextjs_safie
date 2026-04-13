'use client'
import { useState } from 'react'
import { SectionHeading } from './MatchSelectStep'
import { cleanForFacebook } from '@/lib/publishers'

const CONTENT_TYPES = ['Magazine match report', 'Web article', 'Social media long-form post']

interface Props {
  context: string
  matchId: string
  contentType: string
  onContentTypeChange: (t: string) => void
  onGenerated: (content: string) => void
  generatedContent: string
}

export function GenerateStep({ context, matchId, contentType, onContentTypeChange, onGenerated, generatedContent }: Props) {
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [fbText, setFbText]       = useState('')
  const [fbPhoto, setFbPhoto]     = useState<File | null>(null)
  const [fbLoading, setFbLoading] = useState(false)
  const [fbResult, setFbResult]   = useState<{ ok: boolean; msg: string } | null>(null)
  const [copied, setCopied]       = useState(false)

  async function generate() {
    setLoading(true); setError(''); onGenerated('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, contentType, matchId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      onGenerated(data.content)
      setFbText(cleanForFacebook(data.content))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function postToFacebook() {
    setFbLoading(true); setFbResult(null)
    const form = new FormData()
    form.append('message', fbText)
    if (fbPhoto) form.append('image', fbPhoto)
    const res  = await fetch('/api/facebook', { method: 'POST', body: form })
    const data = await res.json()
    setFbLoading(false)
    setFbResult(res.ok ? { ok: true, msg: data.url } : { ok: false, msg: data.error })
  }

  function copyText() {
    navigator.clipboard.writeText(generatedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section>
      <SectionHeading step={3} title="Generate Content" />

      <div className="flex flex-col sm:flex-row gap-4 items-start mb-4">
        <div className="flex-1">
          <label className="block text-sm font-semibold mb-1">📝 Content Type</label>
          <select
            value={contentType}
            onChange={e => onContentTypeChange(e.target.value)}
            className="w-full rounded-lg border-2 px-4 py-3 text-black text-sm outline-none"
            style={{ borderColor: '#2ca3ee' }}
          >
            {CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="pt-6">
          <button
            onClick={generate}
            disabled={loading}
            className="px-8 py-3 rounded-lg font-bold text-white text-sm transition-all whitespace-nowrap"
            style={{ background: loading ? '#555' : 'linear-gradient(90deg,#2ca3ee,#00b8f1)' }}
          >
            {loading ? '✨ Generating…' : '🧠 Generate Content'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm mb-4" style={{ background: '#2d0000', border: '1px solid #f87171', color: '#f87171' }}>
          ❌ {error}
        </div>
      )}

      {generatedContent && (
        <>
          {/* Content display */}
          <h3 className="text-xl font-bold pb-2 mb-3 mt-6" style={{ color: '#2ca3ee', borderBottom: '2px solid #2ca3ee' }}>
            📄 Generated Content
          </h3>

          <div className="rounded-xl p-6 mb-4 text-sm leading-relaxed text-black whitespace-pre-wrap"
            style={{ background: '#fff', borderLeft: '5px solid #2ca3ee', boxShadow: '0 5px 15px rgba(44,163,238,0.15)' }}>
            {generatedContent}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              ['📊 Word Count', generatedContent.split(/\s+/).length],
              ['📝 Characters', generatedContent.length],
              ['📄 Type', contentType.split(' ')[0]],
            ].map(([label, val]) => (
              <div key={label as string} className="rounded-lg p-3 text-center" style={{ background: '#1a1a1a', border: '1px solid #2ca3ee' }}>
                <p className="text-xs opacity-60">{label}</p>
                <p className="text-xl font-black mt-1" style={{ color: '#e6fe00' }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Copy button */}
          <button
            onClick={copyText}
            className="px-6 py-2 rounded-lg font-bold text-black text-sm mb-6 transition-all"
            style={{ background: '#e6fe00' }}
          >
            {copied ? '✅ Copied!' : '📋 Copy Text'}
          </button>

          {/* Facebook section - only for social media posts */}
          {contentType === 'Social media long-form post' && (
            <div className="mt-4 rounded-xl p-5" style={{ background: 'rgba(44,163,238,0.08)', border: '2px solid rgba(44,163,238,0.4)' }}>
              <h3 className="text-lg font-bold mb-3" style={{ color: '#2ca3ee', borderBottom: '2px solid #2ca3ee', paddingBottom: 4 }}>
                📘 Post to Facebook Page
              </h3>
              <p className="text-sm mb-3 opacity-75">Review and edit the post below, optionally attach a photo, then click Post.</p>

              <label className="block text-sm font-semibold mb-1">✏️ Edit post before sending (optional)</label>
              <textarea
                value={fbText}
                onChange={e => setFbText(e.target.value)}
                rows={8}
                className="w-full rounded-lg border-2 px-4 py-3 text-black text-sm outline-none mb-1"
                style={{ borderColor: '#2ca3ee' }}
              />
              <p className="text-xs mb-4" style={{ color: fbText.length > 63206 ? '#f87171' : 'rgba(255,255,255,0.5)' }}>
                {fbText.length} / 63,206 characters
              </p>

              <label className="block text-sm font-semibold mb-2">📷 Attach a photo (optional)</label>
              <input
                type="file"
                accept="image/jpg,image/jpeg,image/png"
                onChange={e => setFbPhoto(e.target.files?.[0] ?? null)}
                className="text-sm text-white mb-4"
              />
              {fbPhoto && (
                <img src={URL.createObjectURL(fbPhoto)} alt="preview" className="w-48 rounded-lg mb-4 border-2" style={{ borderColor: '#2ca3ee' }} />
              )}

              <div className="flex justify-center">
                <button
                  onClick={postToFacebook}
                  disabled={fbLoading || fbText.length > 63206}
                  className="px-8 py-3 rounded-lg font-bold text-white text-sm transition-all"
                  style={{ background: fbLoading ? '#555' : 'linear-gradient(90deg,#2ca3ee,#00b8f1)' }}
                >
                  {fbLoading ? '📡 Posting…' : '📘 Post to Facebook Now'}
                </button>
              </div>

              {fbResult && (
                <div className="mt-3 rounded-lg px-4 py-3 text-sm" style={{
                  background: fbResult.ok ? '#052e16' : '#2d0000',
                  border: `1px solid ${fbResult.ok ? '#4ade80' : '#f87171'}`,
                  color: fbResult.ok ? '#4ade80' : '#f87171',
                }}>
                  {fbResult.ok ? `🎉 Posted! View at: ${fbResult.msg}` : `❌ ${fbResult.msg}`}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}
