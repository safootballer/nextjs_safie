'use client'
import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { SectionHeading } from './MatchSelectStep'
import { cleanForFacebook } from '@/lib/publishers'

const CONTENT_TYPES = ['Magazine match report', 'Web article', 'Social media long-form post']

interface Props {
  context: string
  matchId: string
  contentType: string
  onContentTypeChange: (t: string) => void
  onGenerated: (content: string) => void
  onContentChange: (content: string) => void
  generatedContent: string
}

function ToolbarBtn({ onClick, active, title, children }: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: '0.85rem',
        background: active ? '#2ca3ee' : 'rgba(255,255,255,0.08)',
        color: active ? '#fff' : 'rgba(255,255,255,0.75)',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

export function GenerateStep({
  context, matchId, contentType, onContentTypeChange,
  onGenerated, onContentChange, generatedContent,
}: Props) {
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [fbText, setFbText]       = useState('')
  const [fbPhoto, setFbPhoto]     = useState<File | null>(null)
  const [fbLoading, setFbLoading] = useState(false)
  const [fbResult, setFbResult]   = useState<{ ok: boolean; msg: string } | null>(null)
  const [copied, setCopied]       = useState(false)

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        style: [
          'min-height: 300px',
          'outline: none',
          'font-family: Barlow, sans-serif',
          'font-size: 0.9rem',
          'line-height: 1.75',
          'color: #111',
          'padding: 0',
        ].join(';'),
      },
    },
  })

  useEffect(() => {
    if (editor && generatedContent && !generatedContent.startsWith('<')) {
      const html = generatedContent
        .split('\n\n')
        .filter(Boolean)
        .map(p => '<p>' + p.replace(/\n/g, '<br>') + '</p>')
        .join('')
      editor.commands.setContent(html)
      onContentChange(editor.getHTML())
    }
  }, [generatedContent])

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

  function getPlainText(): string {
    if (!editor) return ''
    return editor.getText()
  }

  function copyText() {
    navigator.clipboard.writeText(getPlainText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  const labelStyle = {
    display: 'block' as const,
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '0.4rem',
  }

  return (
    <section className="fade-up">
      <SectionHeading step={3} title="Generate Content" />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div style={{ flex: '1 1 260px' }}>
          <label style={labelStyle}>Content Type</label>
          <select value={contentType} onChange={e => onContentTypeChange(e.target.value)} className="input-field">
            {CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={generate} disabled={loading} className="btn-primary" style={{ minWidth: 200, flexShrink: 0 }}>
          {loading ? 'Generating...' : 'Generate Content'}
        </button>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {generatedContent && editor && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', marginTop: '1.5rem' }}>
            <h3 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, fontSize: '1.2rem',
              color: '#2ca3ee', textTransform: 'uppercase',
              letterSpacing: '0.04em', margin: 0,
            }}>
              Generated Content
            </h3>
            <button onClick={copyText} className="btn-yellow" style={{ fontSize: '0.8rem', padding: '0.5rem 1.25rem' }}>
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          </div>

          {/* Toolbar */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '4px',
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1.5px solid rgba(44,163,238,0.3)',
            borderBottom: 'none',
            borderRadius: '10px 10px 0 0',
          }}>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')} title="Bold"
            >B</ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')} title="Italic"
            >I</ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')} title="Underline"
            >U</ToolbarBtn>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })} title="Heading 1"
            >H1</ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })} title="Heading 2"
            >H2</ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })} title="Heading 3"
            >H3</ToolbarBtn>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')} title="Bullet list"
            >{'• List'}</ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')} title="Numbered list"
            >{'1. List'}</ToolbarBtn>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
            <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">Undo</ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">Redo</ToolbarBtn>
          </div>

          {/* Editor */}
          <div style={{
            background: '#fff',
            border: '1.5px solid rgba(44,163,238,0.3)',
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.25rem',
          }}>
            <EditorContent editor={editor} />
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              ['Words', getPlainText().split(/\s+/).filter(Boolean).length],
              ['Chars', getPlainText().length],
              ['Type',  contentType.split(' ')[0]],
            ].map(([label, val]) => (
              <div key={label as string} className="metric-card">
                <div className="metric-label">{label}</div>
                <div className="metric-value" style={{ fontSize: '1.5rem' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Facebook */}
          {contentType === 'Social media long-form post' && (
            <div className="glass-card" style={{ padding: '1.5rem', borderTop: '3px solid #2ca3ee' }}>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800, fontSize: '1.2rem',
                color: '#2ca3ee', textTransform: 'uppercase',
                letterSpacing: '0.04em', marginBottom: '0.5rem',
              }}>Post to Facebook</h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1rem' }}>
                Review and edit below, then post.
              </p>
              <label style={labelStyle}>Edit post</label>
              <textarea
                value={fbText}
                onChange={e => setFbText(e.target.value)}
                rows={7}
                className="input-field"
                style={{ marginBottom: '0.4rem' }}
              />
              <p style={{ fontSize: '0.75rem', marginBottom: '1rem', color: fbText.length > 63206 ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
                {fbText.length} / 63,206 characters
              </p>
              <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Photo (optional)</label>
              <input
                type="file" accept="image/jpg,image/jpeg,image/png"
                onChange={e => setFbPhoto(e.target.files?.[0] ?? null)}
                style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem', display: 'block' }}
              />
              {fbPhoto && (
                <img src={URL.createObjectURL(fbPhoto)} alt="preview"
                  style={{ width: 180, borderRadius: 10, marginBottom: '1rem', border: '1px solid rgba(44,163,238,0.4)' }} />
              )}
              <button
                onClick={postToFacebook}
                disabled={fbLoading || fbText.length > 63206}
                className="btn-primary" style={{ width: '100%' }}
              >
                {fbLoading ? 'Posting...' : 'Post to Facebook Now'}
              </button>
              {fbResult && (
                <div className={fbResult.ok ? 'alert-success' : 'alert-error'} style={{ marginTop: '0.75rem' }}>
                  {fbResult.ok ? 'Posted! ' + fbResult.msg : fbResult.msg}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}