import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { publishToSanity } from '@/lib/publishers'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { title, slug, competition, excerpt, contentText, author, countryLeague, asDraft } = body

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!slug)  return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  if (!contentText) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

  // Log what we're receiving to debug
  console.log('Publishing:', { title, slug, competition, asDraft, contentLength: contentText?.length })
  console.log('Sanity env:', {
    hasProjectId: !!process.env.SANITY_PROJECT_ID,
    hasToken: !!process.env.SANITY_TOKEN,
    dataset: process.env.SANITY_DATASET,
  })

  const result = await publishToSanity({
    title,
    slug,
    competition: competition ?? 'AFL',
    excerpt: excerpt ?? '',
    contentText,
    author: author ?? 'SA Footballer',
    countryLeague,
    asDraft,
  })

  console.log('Sanity result:', result)

  if (result.success) {
    return NextResponse.json({ success: true, slug: result.result })
  }
  return NextResponse.json({ success: false, error: result.result }, { status: 500 })
}