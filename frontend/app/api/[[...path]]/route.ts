import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = (process.env.BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '')

type RouteParams = { params: Promise<{ path?: string[] }> }

async function resolvePath(params: RouteParams['params']): Promise<string> {
  const { path } = await params
  return path ? path.join('/') : ''
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const path = await resolvePath(params)
  const searchParams = req.nextUrl.searchParams.toString()
  const url = `${BASE_URL}/api/${path}${searchParams ? `?${searchParams}` : ''}`

  try {
    // Only pass safe headers, avoid passing 'host' or 'connection'
    const headers = new Headers()
    req.headers.forEach((value, key) => {
      if (!['host', 'connection', 'cookie'].includes(key.toLowerCase())) {
        headers.set(key, value)
      }
    })

    const response = await fetch(url, { method: 'GET', headers, cache: 'no-store' })
    
    const resHeaders = new Headers()
    response.headers.forEach((v, k) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k.toLowerCase())) {
        resHeaders.set(k, v)
      }
    })

    const data = await response.arrayBuffer()
    return new NextResponse(data, {
      status: response.status,
      headers: resHeaders,
    })
  } catch (error) {
    console.error(`Proxy GET error for ${url}:`, error)
    return NextResponse.json({ 
      error: 'Backend connection failed', 
      details: String(error),
      url: url
    }, { status: 502 })
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const path = await resolvePath(params)
  const url = `${BASE_URL}/api/${path}`

  try {
    const body = await req.arrayBuffer()
    const headers = new Headers()
    req.headers.forEach((value, key) => {
      if (!['host', 'connection', 'cookie', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value)
      }
    })

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store'
    })

    const resHeaders = new Headers()
    response.headers.forEach((v, k) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k.toLowerCase())) {
        resHeaders.set(k, v)
      }
    })

    const data = await response.arrayBuffer()
    return new NextResponse(data, {
      status: response.status,
      headers: resHeaders,
    })
  } catch (error) {
    console.error(`Proxy POST error for ${url}:`, error)
    return NextResponse.json({ 
      error: 'Backend connection failed', 
      details: String(error),
      url: url
    }, { status: 502 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const path = await resolvePath(params)
  const url = `${BASE_URL}/api/${path}`

  try {
    const headers = new Headers()
    req.headers.forEach((value, key) => {
      if (!['host', 'connection', 'cookie'].includes(key.toLowerCase())) {
        headers.set(key, value)
      }
    })

    const response = await fetch(url, { method: 'DELETE', headers, cache: 'no-store' })
    
    const resHeaders = new Headers()
    response.headers.forEach((v, k) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k.toLowerCase())) {
        resHeaders.set(k, v)
      }
    })

    const data = await response.arrayBuffer()
    return new NextResponse(data, {
      status: response.status,
      headers: resHeaders,
    })
  } catch (error) {
    console.error(`Proxy DELETE error for ${url}:`, error)
    return NextResponse.json({ 
      error: 'Backend connection failed', 
      details: String(error),
      url: url
    }, { status: 502 })
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const path = await resolvePath(params)
  const url = `${BASE_URL}/api/${path}`

  try {
    const body = await req.arrayBuffer()
    const headers = new Headers()
    req.headers.forEach((value, key) => {
      if (!['host', 'connection', 'cookie', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value)
      }
    })

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body,
      cache: 'no-store'
    })

    const resHeaders = new Headers()
    response.headers.forEach((v, k) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k.toLowerCase())) {
        resHeaders.set(k, v)
      }
    })

    const data = await response.arrayBuffer()
    return new NextResponse(data, {
      status: response.status,
      headers: resHeaders,
    })
  } catch (error) {
    console.error(`Proxy PUT error for ${url}:`, error)
    return NextResponse.json({ 
      error: 'Backend connection failed', 
      details: String(error),
      url: url
    }, { status: 502 })
  }
}
