'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { GenerateStep }   from '@/components/steps/GenerateStep'
import { KnowledgeStep }  from '@/components/steps/KnowledgeStep'
import { MatchSelectStep } from '@/components/steps/MatchSelectStep'
import { PublishStep }    from '@/components/steps/PublishStep'

export type MatchLink = {
  id: number
  match_id: string
  home_team: string | null
  away_team: string | null
  competition: string | null
  date: string | null
  venue: string | null
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
  }
}

export default function DashboardPage() {
  const { data: session } = useSession()

  // Step 1 state
  const [matches, setMatches]           = useState<MatchLink[]>([])
  const [grouped, setGrouped]           = useState<Record<string, MatchLink[]>>({})
  const [selectedIds, setSelectedIds]   = useState<string[]>([])
  const [loadingMatches, setLoadingMatches] = useState(true)

  // Step 2 state
  const [kbResults, setKbResults]       = useState<KBResult[]>([])
  const [kbReady, setKbReady]           = useState(false)

  // Step 3 state
  const [generatedContent, setGeneratedContent] = useState('')
  const [contentType, setContentType]           = useState('Magazine match report')

  // Step 4 state
  const [publishedSlug, setPublishedSlug] = useState('')

  useEffect(() => {
    fetch('/api/matches')
      .then(r => r.json())
      .then(d => { setMatches(d.links ?? []); setGrouped(d.grouped ?? {}) })
      .finally(() => setLoadingMatches(false))
  }, [])

  // Notify sidebar via custom events
  useEffect(() => {
    if (kbReady) window.dispatchEvent(new Event('safie:kb-ready'))
  }, [kbReady])
  useEffect(() => {
    if (generatedContent) window.dispatchEvent(new Event('safie:content-ready'))
  }, [generatedContent])

  const combinedContext = kbResults.map(r => r.knowledge).join('\n\n---\n\n')
  const firstMeta       = kbResults[0]?.meta
  const firstMatchId    = kbResults[0]?.matchId ?? 'unknown'

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black" style={{ color: '#2ca3ee' }}>🏈 SAFie</h1>
        <p className="text-xs font-bold tracking-widest uppercase mt-1" style={{ color: '#e6fe00' }}>
          AI by SA Footballer
        </p>
        <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Welcome back, <strong className="text-white">{session?.user?.name}</strong>! 👋
        </p>
      </div>

      <Divider />

      {/* Step 1 */}
      <MatchSelectStep
        grouped={grouped}
        matches={matches}
        loading={loadingMatches}
        selectedIds={selectedIds}
        onSelectionChange={ids => {
          setSelectedIds(ids)
          setKbReady(false)
          setKbResults([])
          setGeneratedContent('')
          setPublishedSlug('')
          window.dispatchEvent(new Event('safie:reset'))
        }}
      />

      {/* Step 2 */}
      {selectedIds.length > 0 && (
        <>
          <Divider />
          <KnowledgeStep
            selectedIds={selectedIds}
            matches={matches}
            onReady={results => { setKbResults(results); setKbReady(true) }}
          />
        </>
      )}

      {/* Step 3 */}
      {kbReady && (
        <>
          <Divider />
          <GenerateStep
            context={combinedContext}
            matchId={firstMatchId}
            contentType={contentType}
            onContentTypeChange={setContentType}
            onGenerated={content => { setGeneratedContent(content); setPublishedSlug('') }}
            generatedContent={generatedContent}
          />
        </>
      )}

      {/* Step 4 */}
      {generatedContent && (
        <>
          <Divider />
          <PublishStep
            content={generatedContent}
            contentType={contentType}
            meta={firstMeta}
            publishedSlug={publishedSlug}
            onPublished={setPublishedSlug}
          />
        </>
      )}

      {/* Footer */}
      <div className="rounded-xl px-6 py-4 text-center text-xs mt-8" style={{ background: '#000', borderTop: '3px solid #2ca3ee' }}>
        <span style={{ color: '#2ca3ee', fontWeight: 700 }}>SAFie</span>
        {' · '}
        <span style={{ color: '#e6fe00', fontWeight: 600 }}>AI by SA Footballer</span>
        {' · '}
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>© 2026 The South Australian Footballer. All rights reserved.</span>
      </div>
    </div>
  )
}

function Divider() {
  return <hr style={{ borderColor: '#2ca3ee', opacity: 0.35 }} />
}
