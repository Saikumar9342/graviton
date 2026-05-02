import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

type RouteParams = { params: Promise<{ path?: string[] }> }

async function resolvePath(params: RouteParams['params']): Promise<string> {
  const { path } = await params
  return path ? path.join('/') : ''
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const path = await resolvePath(params)
  const searchParams = req.nextUrl.searchParams.toString()
  const url = `${BACKEND_URL}/api/${path}${searchParams ? `?${searchParams}` : ''}`

  try {
    const response = await fetch(url, { method: 'GET', headers: req.headers })
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    })
  } catch (error) {
    console.error(`Proxy GET error for ${url}:`, error)
    return NextResponse.json({ error: 'Backend connection failed' }, { status: 502 })
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const path = await resolvePath(params)
  const url = `${BACKEND_URL}/api/${path}`

  try {
    const body = await req.json()
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    // Stream back plain-text or SSE responses (used by /api/chat)
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('text/plain') || contentType.includes('text/event-stream')) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: response.headers,
      })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error(`Proxy POST error for ${url}:`, error)
    return NextResponse.json({ error: 'Backend connection failed' }, { status: 502 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const path = await resolvePath(params)
  const url = `${BACKEND_URL}/api/${path}`

  try {
    const response = await fetch(url, { method: 'DELETE', headers: req.headers })
    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    })
  } catch (error) {
    console.error(`Proxy DELETE error for ${url}:`, error)
    return NextResponse.json({ error: 'Backend connection failed' }, { status: 502 })
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const path = await resolvePath(params)
  const url = `${BACKEND_URL}/api/${path}`

  try {
    const body = await req.json()
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error(`Proxy PUT error for ${url}:`, error)
    return NextResponse.json({ error: 'Backend connection failed' }, { status: 502 })
  }
}
