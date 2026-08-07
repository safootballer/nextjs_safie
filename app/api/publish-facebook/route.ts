import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { postToFacebook } from '@/lib/publishers'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contentType = req.headers.get('content-type') || ''

  let message = ''
  let link = ''
  let imageBuffer: Buffer | undefined
  let imageName: string | undefined

  if (contentType.includes('multipart/form-data')) {
    // Photo upload path
    const formData = await req.formData()
    message = (formData.get('message') as string) || ''
    link    = (formData.get('link') as string) || ''
    const image = formData.get('image') as File | null
    if (image) {
      const arrayBuffer = await image.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
      imageName   = image.name
    }
  } else {
    // JSON path (no photo)
    const body = await req.json()
    message = body.message || ''
    link    = body.link || ''
  }

  if (!message) return NextResponse.json({ error: 'No message provided' }, { status: 400 })

  // When posting a photo, the link can't be a separate field — append to message
  const fullMessage = link && !imageBuffer ? `${message}\n\n${link}` : link ? `${message}\n\n${link}` : message

  const result = await postToFacebook(fullMessage, imageBuffer, imageName)

  if (result.success) {
    return NextResponse.json({ success: true, url: result.result })
  }
  return NextResponse.json({ success: false, error: result.result }, { status: 500 })
}