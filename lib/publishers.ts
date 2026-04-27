import { v4 as uuidv4 } from 'uuid'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

function htmlToPortableText(html: string) {
  if (!html.includes('<')) {
    return html.split('\n\n').map(p => p.trim()).filter(Boolean).map(para => ({
      _type: 'block',
      _key: uuidv4().replace(/-/g, '').slice(0, 12),
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: uuidv4().replace(/-/g, '').slice(0, 12), text: para, marks: [] }],
    }))
  }

  const blocks: any[] = []
  const blockRegex = /<(h1|h2|h3|h4|p)[^>]*>([\s\S]*?)<\/\1>/gi
  let match

  while ((match = blockRegex.exec(html)) !== null) {
    const tag   = match[1].toLowerCase()
    const inner = match[2]

    const styleMap: Record<string, string> = {
      h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', p: 'normal',
    }
    const style = styleMap[tag] ?? 'normal'

    const parts = inner.split(/<br\s*\/?>/gi)

    for (const part of parts) {
      const children: any[] = []
      const inlineRegex = /<(strong|em|u|b|i)[^>]*>([\s\S]*?)<\/\1>|([^<]+)/gi
      let inlineMatch

      while ((inlineMatch = inlineRegex.exec(part)) !== null) {
        if (inlineMatch[3] !== undefined) {
          const text = inlineMatch[3]
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
          if (text.trim()) {
            children.push({
              _type: 'span',
              _key: uuidv4().replace(/-/g, '').slice(0, 12),
              text,
              marks: [],
            })
          }
        } else {
          const markTag = inlineMatch[1].toLowerCase()
          const markMap: Record<string, string> = {
            strong: 'strong', b: 'strong', em: 'em', i: 'em', u: 'underline',
          }
          const mark = markMap[markTag] ?? markTag
          const text = inlineMatch[2]
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&nbsp;/g, ' ')
          if (text.trim()) {
            children.push({
              _type: 'span',
              _key: uuidv4().replace(/-/g, '').slice(0, 12),
              text,
              marks: [mark],
            })
          }
        }
      }

      if (children.length > 0) {
        blocks.push({
          _type: 'block',
          _key: uuidv4().replace(/-/g, '').slice(0, 12),
          style,
          markDefs: [],
          children,
        })
      }
    }
  }

  return blocks.length > 0 ? blocks : [{
    _type: 'block',
    _key: uuidv4().replace(/-/g, '').slice(0, 12),
    style: 'normal',
    markDefs: [],
    children: [{
      _type: 'span',
      _key: uuidv4().replace(/-/g, '').slice(0, 12),
      text: html.replace(/<[^>]+>/g, ''),
      marks: [],
    }],
  }]
}

export async function publishToSanity({
  title, slug, competition, contentText, author,
  countryLeague, amateurGrade,
  homeTeam, awayTeam, homeScore, awayScore, matchDate, venue, round,
  asDraft = false,
}: {
  title: string
  slug: string
  competition: string
  contentText: string
  author: string
  countryLeague?: string | null
  amateurGrade?: string | null
  homeTeam: string
  awayTeam: string
  homeScore: string
  awayScore: string
  matchDate: string
  venue?: string
  round?: string
  asDraft?: boolean
}): Promise<{ success: boolean; result: string }> {
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset   = process.env.SANITY_DATASET || 'production'
  const token     = process.env.SANITY_TOKEN

  if (!projectId || !token) {
    return { success: false, result: 'Sanity credentials not configured.' }
  }

  const docId = `${asDraft ? 'drafts.' : ''}matchresult-${uuidv4().replace(/-/g, '').slice(0, 16)}`
  const url   = `https://${projectId}.api.sanity.io/v2024-01-01/data/mutate/${dataset}`

  const doc: Record<string, unknown> = {
    _id:         docId,
    _type:       'matchResult',
    title,
    slug:        { _type: 'slug', current: slug },
    competition,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    matchDate:   new Date(matchDate).toISOString(),
    venue:       venue ?? '',
    round:       round ?? '',
    content:     htmlToPortableText(contentText),
    author,
  }

  if (competition === 'Country Football' && countryLeague) {
    doc.countryLeague = countryLeague
  }

  if (competition === 'Amateur' && amateurGrade) {
    doc.amateurGrade = amateurGrade
  }

  const payload = { mutations: [{ createOrReplace: doc }] }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) return { success: true, result: slug }
    const body = await res.text()
    return { success: false, result: `Sanity error ${res.status}: ${body}` }
  } catch (e: unknown) {
    return { success: false, result: e instanceof Error ? e.message : String(e) }
  }
}

export function cleanForFacebook(text: string): string {
  text = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
  text = text.replace(/__(.*?)__/g, '$1').replace(/_(.*?)_/g, '$1')

  const replacements: Array<[RegExp, string]> = [
    [/^#+\s*ATTENTION.*$/gim, ''],
    [/^#+\s*THE STORY.*$/gim, 'THE STORY'],
    [/^#+\s*THE HEROES.*$/gim, 'THE HEROES'],
    [/^#+\s*BY THE NUMBERS.*$/gim, 'BY THE NUMBERS'],
    [/^#+\s*CLOSING.*$/gim, ''],
    [/^#+\s*KEY MOMENTS.*$/gim, 'KEY MOMENTS'],
    [/^#+\s*PLAYER PERFORMANCES.*$/gim, 'PLAYER PERFORMANCES'],
    [/^#+\s*THE STATS.*$/gim, 'THE STATS'],
    [/^#+\s*WHAT IT MEANS.*$/gim, 'WHAT IT MEANS'],
    [/^#+\s*HEADLINE.*$/gim, ''],
    [/^#+\s*/gim, ''],
  ]

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement)
  }

  return text.replace(/\n{3,}/g, '\n\n').trim()
}

export async function postToFacebook(
  message: string,
  imageBuffer?: Buffer,
  imageName?: string,
): Promise<{ success: boolean; result: string }> {
  const pageId    = process.env.FACEBOOK_PAGE_ID
  const pageToken = process.env.FACEBOOK_PAGE_TOKEN

  if (!pageId || !pageToken) {
    return { success: false, result: 'Facebook credentials not configured.' }
  }

  try {
    if (imageBuffer) {
      const formData = new FormData()
      const blob = new Blob([imageBuffer.buffer as ArrayBuffer], { type: 'image/jpeg' })
      formData.append('source', blob, imageName || 'photo.jpg')
      formData.append('message', message)
      formData.append('published', 'true')
      formData.append('access_token', pageToken)

      const res  = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, { method: 'POST', body: formData })
      const data = await res.json() as { id?: string; post_id?: string; error?: { message: string } }

      if (data.post_id || data.id) {
        const postId = (data.post_id ?? data.id ?? '').split('_').pop()
        return { success: true, result: `https://www.facebook.com/${pageId}/posts/${postId}` }
      }
      return { success: false, result: data.error?.message ?? JSON.stringify(data) }

    } else {
      const form = new FormData()
      form.append('message', message)
      form.append('published', 'true')
      form.append('access_token', pageToken)

      const res  = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, { method: 'POST', body: form })
      const data = await res.json() as { id?: string; error?: { message: string } }

      if (data.id) {
        return { success: true, result: `https://www.facebook.com/${pageId}/posts/${data.id.split('_').pop()}` }
      }
      return { success: false, result: data.error?.message ?? JSON.stringify(data) }
    }
  } catch (e: unknown) {
    return { success: false, result: e instanceof Error ? e.message : String(e) }
  }
}