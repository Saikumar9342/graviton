import { NextRequest, NextResponse } from 'next/server'
import { fetchWithRetry } from '@/lib/api'
import { TOPIC_REGISTRY } from '@/lib/types'

// Build a flat feed map from the registry: both category IDs and sub-topic IDs → RSS URL
function buildFeedMap() {
  const map: Record<string, string> = {}
  for (const cat of TOPIC_REGISTRY) {
    for (const sub of cat.subtopics) {
      if (sub.rss) map[sub.id] = sub.rss
    }
  }
  return map
}

const FEED_MAP = buildFeedMap()

// Fallback multi-feed list per top-level category
const CATEGORY_DEFAULT_FEEDS: Record<string, string[]> = {
  world:         ['https://feeds.bbci.co.uk/news/world/rss.xml'],
  tech:          ['https://feeds.bbci.co.uk/news/technology/rss.xml', 'https://hnrss.org/frontpage'],
  sports:        ['https://feeds.bbci.co.uk/sport/rss.xml'],
  science:       ['https://feeds.bbci.co.uk/news/science_and_environment/rss.xml'],
  entertainment: ['https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml'],
  music:         ['https://www.billboard.com/feed/'],
  gaming:        ['https://feeds.ign.com/ign/all'],
  finance:       ['https://feeds.reuters.com/reuters/businessNews'],
  health:        ['https://feeds.bbci.co.uk/news/health/rss.xml'],
  politics:      ['https://feeds.bbci.co.uk/news/politics/rss.xml'],
}

function parseRSS(xml: string, limit = 8) {
  const items: { title: string; link: string; description: string; pubDate: string }[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const block = match[1]
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}(?:[^>]*)>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
      return m ? m[1].trim() : ''
    }
    const title = get('title')
    if (!title) continue
    items.push({
      title,
      link: get('link') || get('guid'),
      description: get('description').replace(/<[^>]+>/g, '').slice(0, 180),
      pubDate: get('pubDate'),
    })
  }
  return items
}

async function fetchFeed(url: string, limit = 8) {
  try {
    const res = await fetchWithRetry(url, {
      headers: { 'User-Agent': 'Graviton/1.0' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRSS(xml, limit)
  } catch {
    return []
  }
}

async function fetchMultiFeeds(urls: string[], perFeed = 5) {
  if (urls.length === 0) return []
  if (urls.length === 1) return fetchFeed(urls[0], 8)
  const results = await Promise.all(urls.map(u => fetchFeed(u, perFeed)))
  const merged = results.flat()
  const seen = new Set<string>()
  return merged
    .filter(item => { if (seen.has(item.title)) return false; seen.add(item.title); return true })
    .sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime())
    .slice(0, 12)
}

async function fetchWeather(city = 'auto') {
  try {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`
    const res = await fetchWithRetry(url, { next: { revalidate: 1800 } })
    if (!res.ok) return null
    const data = await res.json()
    const current = data.current_condition?.[0]
    const area = data.nearest_area?.[0]
    if (!current) return null
    return {
      temp_c: parseInt(current.temp_C),
      temp_f: parseInt(current.temp_F),
      feels_like_c: parseInt(current.FeelsLikeC),
      humidity: parseInt(current.humidity),
      desc: current.weatherDesc?.[0]?.value ?? '',
      wind_kmph: parseInt(current.windspeedKmph),
      city: area?.areaName?.[0]?.value ?? city,
      country: area?.country?.[0]?.value ?? '',
      forecast: (data.weather ?? []).slice(0, 3).map((d: any) => ({
        date: d.date,
        max_c: parseInt(d.maxtempC),
        min_c: parseInt(d.mintempC),
        desc: d.hourly?.[4]?.weatherDesc?.[0]?.value ?? '',
      })),
    }
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categories = (searchParams.get('categories') ?? 'world,tech').split(',').filter(Boolean)
  const subTopics  = (searchParams.get('subtopics') ?? '').split(',').filter(Boolean)
  const city = searchParams.get('city') ?? 'auto'

  // For each category, choose sub-topic feeds if the user has selected any; else use defaults
  type FeedTask = { key: string; urls: string[] }
  const tasks: FeedTask[] = categories.map(cat => {
    const active = subTopics.filter(st => st.startsWith(`${cat}_`))
    const urls = active.length > 0
      ? active.map(st => FEED_MAP[st]).filter(Boolean)
      : (CATEGORY_DEFAULT_FEEDS[cat] ?? [])
    return { key: cat, urls }
  })

  const [weatherData, ...feedGroups] = await Promise.all([
    fetchWeather(city),
    ...tasks.map(({ urls }) => fetchMultiFeeds(urls)),
  ])

  const news: Record<string, unknown[]> = {}
  tasks.forEach(({ key }, i) => { news[key] = feedGroups[i] })

  return NextResponse.json({ weather: weatherData, news })
}
