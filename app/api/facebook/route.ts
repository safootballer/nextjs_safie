import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { postToFacebook } from '@/lib/publishers'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const message  = formData.get('message') as string
  const image    = formData.get('image') as File | null

  if (!message) return NextResponse.json({ error: 'No message provided' }, { status: 400 })

  let imageBuffer: Buffer | undefined
  let imageName: string | undefined

  if (image) {
    const arrayBuffer = await image.arrayBuffer()
    imageBuffer = Buffer.from(arrayBuffer)
    imageName   = image.name
  }

  const result = await postToFacebook(message, imageBuffer, imageName)

  if (result.success) {
    return NextResponse.json({ success: true, url: result.result })
  }
  return NextResponse.json({ success: false, error: result.result }, { status: 500 })
}
