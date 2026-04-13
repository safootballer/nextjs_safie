import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { publishToSanity } from '@/lib/publishers'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, slug, competition, excerpt, contentText, author, countryLeague, asDraft } = body

  if (!title || !slug || !contentText) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const result = await publishToSanity({
    title, slug, competition, excerpt, contentText, author, countryLeague, asDraft,
  })

  if (result.success) {
    return NextResponse.json({ success: true, slug: result.result })
  }
  return NextResponse.json({ success: false, error: result.result }, { status: 500 })
}
