// safie-leagues/app/api/cron-fixtures/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { syncAllFixtures } from '@/lib/syncFixtures'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log(`[FIXTURES CRON] Started at ${new Date().toISOString()} — running in background`)
  runSyncInBackground()

  return NextResponse.json({
    success: true,
    message: 'Fixtures sync started in background',
    startedAt: new Date().toISOString(),
  })
}

async function runSyncInBackground() {
  const start = Date.now()
  try {
    const results = await syncAllFixtures()
    const ok   = results.filter(r => r.success).length
    const fail = results.filter(r => !r.success).length
    const total = results.reduce((sum, r) => sum + (r.count ?? 0), 0)
    console.log(`[FIXTURES CRON] Done in ${((Date.now()-start)/1000).toFixed(1)}s: ${ok} grades ok, ${fail} failed, ${total} fixtures total`)
  } catch (e: any) {
    console.error(`[FIXTURES CRON] Fatal: ${e.message}`)
  }
}