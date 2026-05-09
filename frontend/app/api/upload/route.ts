import { NextRequest, NextResponse } from 'next/server'
import { fetchWithRetry } from '@/lib/api'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const response = await fetchWithRetry(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Upload proxy error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 502 })
  }
}
