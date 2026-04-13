import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { getPrompt, calculateOpenAICost } from '@/lib/constants'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { context, contentType, matchId } = await req.json()
  if (!context) return NextResponse.json({ error: 'No context provided' }, { status: 400 })

  const promptTemplate = getPrompt(contentType ?? 'Magazine match report')
  const prompt = promptTemplate.replace('{context}', context)

  const model = 'gpt-4o-mini'

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.25,
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = completion.choices[0].message.content ?? ''
    const usage = completion.usage

    // Save cost
    if (usage) {
      const costUsd = calculateOpenAICost(usage.prompt_tokens, usage.completion_tokens, model)
      const userId = parseInt((session.user as any).id ?? '0', 10)

      await prisma.generationCost.create({
        data: {
          user_id: userId,
          match_id: matchId ?? 'unknown',
          content_type: contentType,
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
          cost_usd: costUsd,
          model,
          generated_at: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json({
      content,
      usage: usage ?? null,
      costUsd: usage ? calculateOpenAICost(usage.prompt_tokens, usage.completion_tokens, model) : null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
