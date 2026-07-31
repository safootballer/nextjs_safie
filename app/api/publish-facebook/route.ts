import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { postToFacebook } from '@/lib/publishers'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, link } = await req.json()

  if (!message) return NextResponse.json({ error: 'No message provided' }, { status: 400 })

  // Append link to message if provided
  const fullMessage = link ? `${message}\n\n${link}` : message

  const result = await postToFacebook(fullMessage)

  if (result.success) {
    return NextResponse.json({ success: true, postId: result.result })
  }
  return NextResponse.json({ success: false, error: result.result }, { status: 500 })
}