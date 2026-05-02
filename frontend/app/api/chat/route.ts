import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const backendRes = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!backendRes.ok || !backendRes.body) {
      const errorText = await backendRes.text().catch(() => 'Backend error')
      return NextResponse.json({ error: errorText }, { status: 502 })
    }

    // Pipe the stream directly — no format conversion needed
    return new Response(backendRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    console.error('Chat proxy error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
