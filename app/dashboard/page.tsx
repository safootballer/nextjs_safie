'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { GenerateStep }    from '@/components/steps/GenerateStep'
import { KnowledgeStep }   from '@/components/steps/KnowledgeStep'
import { MatchSelectStep } from '@/components/steps/MatchSelectStep'
import { PublishStep }     from '@/components/steps/PublishStep'

export type MatchLink = {
  id: number
  match_id: string
  home_team: string | null
  away_team: string | null
  competition: string | null
  date: string | null
  venue: string | null
  amateur_grade: string | null
  sanfl_grade: string | null
}

export type KBResult = {
  matchId: string
  knowledge: string
  meta: {
    homeTeam: string
    awayTeam: string
    date: string
    venue: string
    competition: string
    homeScore: number
    awayScore: number
    margin: number
    detectedCountryLeague: string | null
    isCountryFootball: boolean
    amateurGrade: string | null
    sanflGrade: string | null
  }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [matches, setMatches]               = useState<MatchLink[]>([])
  const [grouped, setGrouped]               = useState<Record<string, MatchLink[]>>({})
  const [selectedIds, setSelectedIds]       = useState<string[]>([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [kbResults, setKbResults]           = useState<KBResult[]>([])
  const [kbReady, setKbReady]               = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [editedHTML, setEditedHTML]         = useState('')
  const [contentType, setContentType]       = useState('Magazine match report')
  const [publishedSlug, setPublishedSlug]   = useState('')

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(d => { setMatches(d.links ?? []); setGrouped(d.grouped ?? {}) })
      .finally(() => setLoadingMatches(false))
  }, [])

  useEffect(() => { if (kbReady) window.dispatchEvent(new Event('safie:kb-ready')) }, [kbReady])
  useEffect(() => { if (generatedContent) window.dispatchEvent(new Event('safie:content-ready')) }, [generatedContent])

  const combinedContext = kbResults.map(r => r.knowledge).join('\n\n---\n\n')
  const firstMeta       = kbResults[0]?.meta
  const firstMatchId    = kbResults[0]?.matchId ?? 'unknown'

  function resetAll(ids: string[]) {
    setSelectedIds(ids)
    setKbReady(false)
    setKbResults([])
    setGeneratedContent('')
    setEditedHTML('')
    setPublishedSlug('')
    window.dispatchEvent(new Event('safie:reset'))
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: '5rem' }}>

      <div className="fade-up" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900, fontSize: '2.5rem',
            color: '#2ca3ee', letterSpacing: '-0.01em', margin: 0,
          }}>SAFie</h1>
          <span className="badge-yellow">AI by SA Footballer</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
          {'Welcome back, '}
          <strong style={{ color: '#fff' }}>{session?.user?.name}</strong>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <MatchSelectStep
          grouped={grouped}
          matches={matches}
          loading={loadingMatches}
          selectedIds={selectedIds}
          onSelectionChange={resetAll}
        />

        {selectedIds.length > 0 && (
          <KnowledgeStep
            selectedIds={selectedIds}
            matches={matches}
            onReady={results => { setKbResults(results); setKbReady(true) }}
          />
        )}

        {kbReady && (
          <GenerateStep
            context={combinedContext}
            matchId={firstMatchId}
            contentType={contentType}
            onContentTypeChange={setContentType}
            onGenerated={content => {
              setGeneratedContent(content)
              setEditedHTML('')
              setPublishedSlug('')
            }}
            onContentChange={html => setEditedHTML(html)}
            generatedContent={generatedContent}
          />
        )}

        {generatedContent && (
          <PublishStep
            content={editedHTML || generatedContent}
            contentType={contentType}
            meta={firstMeta}
            publishedSlug={publishedSlug}
            onPublished={setPublishedSlug}
          />
        )}
      </div>

      <div style={{
        marginTop: '4rem', textAlign: 'center',
        fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)',
        paddingTop: '1.5rem', borderTop: '1px solid rgba(44,163,238,0.15)',
      }}>
        <span style={{ color: '#2ca3ee', fontWeight: 700 }}>SAFie</span>
        {' · '}
        <span style={{ color: '#e6fe00', fontWeight: 600 }}>AI by SA Footballer</span>
        {' · '}
        {'2026 The South Australian Footballer'}
      </div>
    </div>
  )
}