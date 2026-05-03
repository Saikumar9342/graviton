'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw, Plus, ChevronRight } from 'lucide-react'
import { fetchSettings } from '@/lib/api'
import { TOPIC_REGISTRY } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface NewsItem { title: string; link: string; description: string; pubDate: string }
interface WeatherDay { date: string; max_c: number; min_c: number; desc: string }
interface WeatherData {
  temp_c: number; temp_f: number; feels_like_c: number
  humidity: number; desc: string; wind_kmph: number
  city: string; country: string
  forecast: WeatherDay[]
}
interface DashboardData {
  weather: WeatherData | null
  news: Record<string, NewsItem[]>
}

// Derive flat topic list from registry for components that need id+label+emoji
const TOPICS = TOPIC_REGISTRY.map(t => ({ id: t.id, label: t.label, emoji: t.emoji }))

const QUICK_PROMPTS = [
  { title: 'Explain quantum computing',      tag: 'Learn',   est: '2 min' },
  { title: 'Draft a Python web scraper',     tag: 'Code',    est: '4 min' },
  { title: "Summarise today's tech news",    tag: 'Brief',   est: '1 min' },
  { title: 'Plan a workout for the week',    tag: 'Plan',    est: '3 min' },
  { title: 'Compare Kafka vs. RabbitMQ',     tag: 'Compare', est: '5 min' },
  { title: 'Outline a product launch memo',  tag: 'Write',   est: '6 min' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(pubDate: string) {
  try {
    const diff = Date.now() - new Date(pubDate).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return `${Math.floor(diff / 60000)}m ago`
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  } catch { return '' }
}

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

// ── Masthead ──────────────────────────────────────────────────────────────────

function Masthead({ now, onRefresh }: { now: Date; onRefresh: () => void }) {
  const issue = `Vol. ${now.getFullYear() - 2024} · No. ${Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)}`
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const hour = now.getHours()
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ padding: '18px 32px 16px', borderBottom: '1px solid var(--gv-rule)' }}>
      {/* utility row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 16, fontSize: 10.5, fontFamily: 'var(--font-jetbrains-mono, monospace)', letterSpacing: '0.07em', color: 'var(--gv-ink-4)' }}>
          <span>{issue}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>EST. 2024</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>EDITORIAL EDITION</span>
        </div>
        <button
          onClick={onRefresh}
          style={{ appearance: 'none', border: '1px solid var(--gv-rule)', background: 'transparent', color: 'var(--gv-ink-3)', width: 28, height: 28, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <RefreshCw style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {/* nameplate */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontSize: 'clamp(40px, 5vw, 68px)', lineHeight: 1, letterSpacing: '-0.04em', fontWeight: 500, color: 'var(--gv-ink)', whiteSpace: 'nowrap' }}>
          The Daily<span style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--gv-accent)' }}> Brief</span>
        </div>
        <div style={{ textAlign: 'right', paddingBottom: 6 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', letterSpacing: '0.1em', color: 'var(--gv-ink-4)', textTransform: 'uppercase' }}>Dateline</div>
          <div style={{ fontSize: 12.5, color: 'var(--gv-ink-2)', marginTop: 3 }}>{dateStr}</div>
        </div>
      </div>

      {/* dek */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '3px double var(--gv-rule)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, color: 'var(--gv-ink-2)', maxWidth: 680, lineHeight: 1.5 }}>
          {greeting}. Curated answers, working drafts, and a personalised{' '}
          <span style={{ fontStyle: 'italic', fontFamily: 'var(--font-fraunces, Georgia, serif)' }}>briefing</span>{' '}
          across the topics you follow.
        </div>
        <div style={{ fontSize: 10.5, fontFamily: 'var(--font-jetbrains-mono, monospace)', letterSpacing: '0.08em', color: 'var(--gv-ink-4)', whiteSpace: 'nowrap' }}>
          UPDATED · {timeStr}
        </div>
      </div>
    </div>
  )
}

// ── Topic Rail ────────────────────────────────────────────────────────────────

function TopicRail({ active, setActive, enabledTopics }: { active: string; setActive: (id: string) => void; enabledTopics?: string[] }) {
  const visibleTopics = enabledTopics ? TOPICS.filter(t => enabledTopics.includes(t.id)) : TOPICS
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--gv-rule)', padding: '0 24px', overflowX: 'auto', scrollbarWidth: 'none', gap: 0 }}>
      {visibleTopics.map((t, i) => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'stretch' }}>
          {i > 0 && <div style={{ width: 1, background: 'var(--gv-rule)', margin: '8px 0' }} />}
          <button
            onClick={() => setActive(t.id)}
            style={{
              appearance: 'none', border: 0, background: 'transparent',
              padding: '8px 12px 10px',
              fontFamily: 'inherit', fontSize: 12.5, fontWeight: active === t.id ? 600 : 500,
              color: active === t.id ? 'var(--gv-ink)' : 'var(--gv-ink-3)',
              cursor: 'pointer', position: 'relative', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span style={{ fontSize: 13 }}>{(t as any).emoji}</span>
            {t.label}
            {active === t.id && (
              <span style={{ position: 'absolute', left: 8, right: 8, bottom: 0, height: 2, background: 'var(--gv-accent)' }} />
            )}
          </button>
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <button style={{ appearance: 'none', border: 0, background: 'transparent', color: 'var(--gv-ink-3)', fontSize: 12, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        Customise <Plus style={{ width: 12, height: 12 }} />
      </button>
    </div>
  )
}

// ── Clock Card ────────────────────────────────────────────────────────────────

function ClockCard({ now }: { now: Date }) {
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  const sec = String(now.getSeconds()).padStart(2, '0')
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.replace('_', ' ')
  const day = now.toLocaleDateString(undefined, { weekday: 'long' })
  const dateStr = now.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)

  return (
    <div style={{ border: '1px solid var(--gv-rule)', padding: '16px 18px', background: 'var(--gv-paper-2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gv-ink-3)' }}>Local Time</div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--gv-ink-4)' }}>{tz}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontSize: 52, lineHeight: 0.95, letterSpacing: '-0.04em', fontWeight: 500, color: 'var(--gv-ink)' }}>{time}</span>
        <span style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 14, color: 'var(--gv-ink-3)', letterSpacing: '0.04em' }}>:{sec}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 12.5, color: 'var(--gv-ink-2)' }}>{day}, {dateStr}</div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--gv-ink-4)' }}>{dayOfYear} / 365</div>
      </div>
    </div>
  )
}

// ── Weather Block ─────────────────────────────────────────────────────────────

function WeatherBlock({ weather, loading }: { weather: WeatherData | null; loading: boolean }) {
  if (loading) return (
    <div style={{ border: '1px solid var(--gv-rule)', padding: '16px 18px', background: 'var(--gv-paper-2)', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--gv-ink-4)', letterSpacing: '0.06em' }}>FETCHING WEATHER…</span>
    </div>
  )
  if (!weather) return null

  return (
    <div style={{ border: '1px solid var(--gv-rule)', padding: '16px 18px', background: 'var(--gv-paper-2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gv-ink-3)' }}>Weather · {weather.city}</div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--gv-ink-4)' }}>{weather.country}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontSize: 44, lineHeight: 0.95, letterSpacing: '-0.04em', fontWeight: 500, color: 'var(--gv-ink)' }}>{weather.temp_c}°</div>
          <div style={{ fontSize: 12.5, color: 'var(--gv-ink-2)', marginTop: 6, textTransform: 'capitalize' }}>{weather.desc}</div>
          <div style={{ fontSize: 11, color: 'var(--gv-ink-4)', marginTop: 2, fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>Feels {weather.feels_like_c}° · {weather.humidity}% hum · {weather.wind_kmph} km/h</div>
        </div>
        {weather.forecast.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {weather.forecast.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', borderLeft: '1px solid var(--gv-rule)', paddingLeft: 8 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--gv-ink-4)', textTransform: 'uppercase' }}>
                  {i === 0 ? 'Today' : new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gv-ink)', marginTop: 3 }}>{d.max_c}°</div>
                <div style={{ fontSize: 11, color: 'var(--gv-ink-4)' }}>{d.min_c}°</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section Head ──────────────────────────────────────────────────────────────

function SectionHead({ kicker, title, meta }: { kicker: string; title: string; meta?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
      <div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gv-ink-3)' }}>{kicker}</div>
        <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontSize: 21, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 2, color: 'var(--gv-ink)' }}>{title}</div>
      </div>
      {meta && <div style={{ fontSize: 10.5, fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--gv-ink-4)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{meta}</div>}
    </div>
  )
}

// ── Quick Prompts Grid ────────────────────────────────────────────────────────

function QuickPromptsGrid({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--gv-rule)', borderLeft: '1px solid var(--gv-rule)' }}>
      {QUICK_PROMPTS.map((p, i) => (
        <button
          key={i}
          onClick={() => onPick(p.title)}
          style={{ appearance: 'none', textAlign: 'left', padding: '11px 13px', background: 'transparent', border: 0, borderRight: '1px solid var(--gv-rule)', borderBottom: '1px solid var(--gv-rule)', cursor: 'pointer', color: 'var(--gv-ink)', display: 'flex', flexDirection: 'column', gap: 5, transition: 'background .12s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--gv-paper-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gv-accent-ink)' }}>{p.tag}</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--gv-ink-4)' }}>~{p.est}</span>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.35, color: 'var(--gv-ink)', fontWeight: 500 }}>{p.title}</div>
        </button>
      ))}
    </div>
  )
}

// ── Featured Thread ───────────────────────────────────────────────────────────

function FeaturedThread({ latestChat, onPick }: { latestChat?: string; onPick: (t: string) => void }) {
  const title = latestChat ?? 'Microservice Architecture Proposal'
  return (
    <div style={{ borderTop: '3px double var(--gv-rule)', borderBottom: '1px solid var(--gv-rule)', padding: '14px 0', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gv-accent-ink)' }}>Editor's pick</span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--gv-ink-4)' }}>· RESUME THREAD</span>
        </div>
        <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--gv-ink)' }}>
          Resume your work on{' '}
          <span style={{ fontStyle: 'italic' }}>{title}</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--gv-ink-3)', lineHeight: 1.5 }}>
          Pick up right where you left off — Graviton remembers your context.
        </div>
        <button
          onClick={() => onPick(title)}
          style={{ appearance: 'none', marginTop: 10, border: 0, background: 'var(--gv-accent)', color: 'var(--gv-paper)', padding: '6px 13px', borderRadius: 3, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          Continue thread <ChevronRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
      <div style={{ width: 90, height: 90, alignSelf: 'center', background: 'repeating-linear-gradient(135deg, var(--gv-paper-3), var(--gv-paper-3) 2px, transparent 2px, transparent 6px)', border: '1px solid var(--gv-rule)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 8.5, fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--gv-ink-4)', textAlign: 'center', lineHeight: 1.4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Thread<br />Preview</div>
      </div>
    </div>
  )
}

// ── News Column ───────────────────────────────────────────────────────────────

function NewsColumn({ catId, items, loading, onPick }: { catId: string; items: NewsItem[]; loading: boolean; onPick: (t: string) => void }) {
  const label = TOPICS.find(t => t.id === catId)?.label ?? catId

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ borderBottom: '2px solid var(--gv-rule)', paddingBottom: 6, marginBottom: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gv-accent-ink)', fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--gv-ink-4)' }}>{items.length}</span>
      </div>

      {loading ? (
        [1,2,3].map(i => (
          <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--gv-rule-soft)' }}>
            <div style={{ height: 10, background: 'var(--gv-paper-3)', borderRadius: 2, marginBottom: 5, width: '90%' }} />
            <div style={{ height: 10, background: 'var(--gv-paper-3)', borderRadius: 2, width: '65%' }} />
          </div>
        ))
      ) : items.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--gv-ink-4)', padding: '12px 0', fontFamily: 'var(--font-jetbrains-mono, monospace)' }}>No stories</div>
      ) : items.slice(0, 6).map((item, i) => (
        <button
          key={i}
          onClick={() => onPick(`Tell me more about: "${item.title}". ${item.description}`)}
          style={{ appearance: 'none', border: 0, background: 'transparent', textAlign: 'left', padding: '9px 0', borderBottom: i < Math.min(items.length, 6) - 1 ? '1px solid var(--gv-rule-soft)' : 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 3, transition: 'background .1s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--gv-paper-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.35, color: 'var(--gv-ink)' }}>{item.title}</div>
          {item.description && <div style={{ fontSize: 12, color: 'var(--gv-ink-3)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</div>}
          <div style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--gv-ink-4)', marginTop: 1 }}>{timeAgo(item.pubDate)}</div>
        </button>
      ))}
    </div>
  )
}

// ── Stat Strip ────────────────────────────────────────────────────────────────

function StatStrip() {
  const stats = [
    { l: 'Threads', v: '—',  d: 'this session' },
    { l: 'Tokens',  v: '—',  d: 'used today' },
    { l: 'Saved',   v: '—',  d: 'pinned' },
    { l: 'Streak',  v: '—',  d: 'daily use' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderTop: '1px solid var(--gv-rule)', borderBottom: '1px solid var(--gv-rule)' }}>
      {stats.map((s, i) => (
        <div key={i} style={{ padding: '10px 12px', borderRight: i < 3 ? '1px solid var(--gv-rule)' : 'none' }}>
          <div style={{ fontSize: 9.5, fontFamily: 'var(--font-jetbrains-mono, monospace)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gv-ink-3)' }}>{s.l}</div>
          <div style={{ fontFamily: 'var(--font-fraunces, Georgia, serif)', fontSize: 22, fontWeight: 500, marginTop: 2, letterSpacing: '-0.02em', color: 'var(--gv-ink)' }}>{s.v}</div>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--gv-ink-4)', marginTop: 2 }}>{s.d}</div>
        </div>
      ))}
    </div>
  )
}

// ── Open Threads ──────────────────────────────────────────────────────────────

function OpenThreads({ onPick }: { onPick: (t: string) => void }) {
  const items = [
    { hook: 'Continue', title: 'Microservice App Architecture Proposal', meta: 'Yesterday · 14 msgs' },
    { hook: 'Continue', title: 'Go gRPC backend design',                 meta: '2 days ago · 8 msgs' },
    { hook: 'Resume',   title: 'Python Web Scraper Guide',               meta: '3 days ago · 21 msgs' },
    { hook: 'Resume',   title: 'High-performance distributed system',    meta: '4 days ago · 6 msgs' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((s, i) => (
        <button
          key={i}
          onClick={() => onPick(s.title)}
          style={{ appearance: 'none', background: 'transparent', border: 0, padding: '10px 0', borderBottom: i < items.length - 1 ? '1px solid var(--gv-rule-soft)' : 'none', textAlign: 'left', cursor: 'pointer', display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'baseline', gap: 12, color: 'var(--gv-ink)', transition: 'background .1s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--gv-paper-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--gv-accent-ink)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.hook}</span>
          <span style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.35 }}>{s.title}</span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--gv-ink-4)', whiteSpace: 'nowrap' }}>{s.meta}</span>
        </button>
      ))}
    </div>
  )
}

// ── Colophon ──────────────────────────────────────────────────────────────────

function Colophon({ now }: { now: Date }) {
  return (
    <div style={{ border: '1px solid var(--gv-rule)', padding: '12px 14px', background: 'var(--gv-paper-2)' }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gv-ink-3)', marginBottom: 8 }}>Colophon</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: 12, color: 'var(--gv-ink-2)' }}>
        {[
          ['MODEL',   'Graviton · Versatile'],
          ['CONTEXT', '200K tokens · 12% used'],
          ['MEMORY',  'On · synced 2m ago'],
          ['TONE',    'Editorial, concise'],
        ].map(([k, v]) => (
          <>
            <span key={k} style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 10, color: 'var(--gv-ink-4)', alignSelf: 'center' }}>{k}</span>
            <span key={v} style={k === 'TONE' ? { fontStyle: 'italic', fontFamily: 'var(--font-fraunces, Georgia, serif)' } : {}}>{v}</span>
          </>
        ))}
        <span style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 10, color: 'var(--gv-ink-4)' }}>TIME</span>
        <span style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: 11 }}>
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </span>
      </div>
    </div>
  )
}

// ── CSS vars injected once ────────────────────────────────────────────────────

function applyGvVars() {
  const r = document.documentElement
  const isDark = r.classList.contains('dark')
  // Mirror the --ed-* vars already set in globals.css so dashboard components
  // stay in sync when the user switches themes or applies a preset.
  r.style.setProperty('--gv-paper',       getComputedStyle(r).getPropertyValue('--background').trim() || (isDark ? 'oklch(0.16 0.008 80)' : 'oklch(0.985 0.006 80)'))
  r.style.setProperty('--gv-paper-2',     getComputedStyle(r).getPropertyValue('--ed-paper-2').trim() || (isDark ? 'oklch(0.205 0.01 80)' : 'oklch(0.965 0.008 75)'))
  r.style.setProperty('--gv-paper-3',     getComputedStyle(r).getPropertyValue('--ed-paper-3').trim() || (isDark ? 'oklch(0.245 0.012 80)' : 'oklch(0.94 0.01 75)'))
  r.style.setProperty('--gv-rule',        getComputedStyle(r).getPropertyValue('--ed-rule').trim()    || (isDark ? 'oklch(0.32 0.012 80)' : 'oklch(0.85 0.012 75)'))
  r.style.setProperty('--gv-rule-soft',   getComputedStyle(r).getPropertyValue('--ed-rule-soft').trim() || (isDark ? 'oklch(0.255 0.011 80)' : 'oklch(0.9 0.012 75)'))
  r.style.setProperty('--gv-ink',         getComputedStyle(r).getPropertyValue('--foreground').trim() || (isDark ? 'oklch(0.95 0.01 80)' : 'oklch(0.18 0.01 60)'))
  r.style.setProperty('--gv-ink-2',       getComputedStyle(r).getPropertyValue('--ed-ink-2').trim()   || (isDark ? 'oklch(0.82 0.012 80)' : 'oklch(0.32 0.012 60)'))
  r.style.setProperty('--gv-ink-3',       getComputedStyle(r).getPropertyValue('--ed-ink-3').trim()   || (isDark ? 'oklch(0.62 0.013 80)' : 'oklch(0.5 0.013 60)'))
  r.style.setProperty('--gv-ink-4',       getComputedStyle(r).getPropertyValue('--ed-ink-4').trim()   || (isDark ? 'oklch(0.46 0.013 80)' : 'oklch(0.65 0.013 60)'))
  // Accent: use the live --primary (user may have changed it via preset)
  const primary = getComputedStyle(r).getPropertyValue('--primary').trim()
  r.style.setProperty('--gv-accent',      primary || getComputedStyle(r).getPropertyValue('--ed-accent').trim() || (isDark ? 'oklch(0.74 0.14 42)' : 'oklch(0.58 0.16 42)'))
  r.style.setProperty('--gv-accent-soft', isDark ? 'oklch(0.28 0.08 42)' : 'oklch(0.92 0.05 42)')
  r.style.setProperty('--gv-accent-ink',  isDark ? 'oklch(0.86 0.13 42)' : 'oklch(0.32 0.13 42)')
}

function useGvTheme() {
  useEffect(() => {
    applyGvVars()
    // Re-apply whenever dark/light class changes
    const observer = new MutationObserver(applyGvVars)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
    return () => observer.disconnect()
  }, [])
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void
}

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  const now = useClock()
  const [activeTopic, setActiveTopic] = useState('world')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [enabledTopics, setEnabledTopics] = useState<string[]>(['world', 'tech', 'weather'])
  const [enabledSubTopics, setEnabledSubTopics] = useState<string[]>([])
  const [city, setCity] = useState('')
  const prefsLoaded = useRef(false)
  useGvTheme()

  // Load user prefs once from DB
  useEffect(() => {
    if (prefsLoaded.current) return
    prefsLoaded.current = true
    fetchSettings().then((prefs) => {
      const topics = (prefs.dashboardTopics as string[] | undefined) ?? ['world', 'tech', 'weather']
      const subTopics = (prefs.dashboardSubTopics as string[] | undefined) ?? []
      const savedCity = (prefs.dashboardCity as string | undefined) ?? ''
      setEnabledTopics(topics)
      setEnabledSubTopics(subTopics)
      setCity(savedCity)
      setActiveTopic((cur) => (topics.includes(cur) ? cur : topics.find(t => t !== 'weather') ?? topics[0] ?? 'world'))
    }).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const cats = enabledTopics.filter(t => t !== 'weather').join(',')
      const cityParam = city ? `&city=${encodeURIComponent(city)}` : ''
      const subParam = enabledSubTopics.length > 0 ? `&subtopics=${enabledSubTopics.join(',')}` : ''
      const res = await fetch(`/api/dashboard?categories=${cats}${cityParam}${subParam}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [enabledTopics, enabledSubTopics, city])

  useEffect(() => { load() }, [load, refreshKey])

  const activeNews = data?.news?.[activeTopic] ?? []

  // Split active topic news into 3 columns newspaper-style
  const col1 = activeNews.filter((_, i) => i % 3 === 0)
  const col2 = activeNews.filter((_, i) => i % 3 === 1)
  const col3 = activeNews.filter((_, i) => i % 3 === 2)

  return (
    <div
      className="flex flex-col w-full h-full overflow-y-auto"
      style={{ background: 'var(--gv-paper)', color: 'var(--gv-ink)', fontFamily: 'inherit' }}
    >
      {/* Masthead */}
      <Masthead now={now} onRefresh={() => setRefreshKey(k => k + 1)} />

      {/* Topic Rail */}
      <TopicRail active={activeTopic} setActive={setActiveTopic} enabledTopics={enabledTopics} />

      {/* Main grid */}
      <div style={{ padding: '20px 32px 40px', display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 36, flex: 1 }}>

        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

          <FeaturedThread onPick={onSuggestionClick} />

          {/* News in 3 newspaper columns */}
          <section>
            <SectionHead kicker={`${TOPICS.find(t=>t.id===activeTopic)?.emoji ?? ''} ${TOPICS.find(t=>t.id===activeTopic)?.label ?? ''} · Top Stories`} title="Latest headlines" meta={loading ? 'LOADING…' : `${activeNews.length} stories`} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 20px', borderTop: '1px solid var(--gv-rule)' }}>
              <NewsColumn catId={activeTopic} items={col1} loading={loading} onPick={onSuggestionClick} />
              <div style={{ borderLeft: '1px solid var(--gv-rule)', paddingLeft: 20 }}>
                <NewsColumn catId={activeTopic} items={col2} loading={loading} onPick={onSuggestionClick} />
              </div>
              <div style={{ borderLeft: '1px solid var(--gv-rule)', paddingLeft: 20 }}>
                <NewsColumn catId={activeTopic} items={col3} loading={loading} onPick={onSuggestionClick} />
              </div>
            </div>
          </section>

          <section>
            <SectionHead kicker="Quick Prompts" title="Start a thread" meta={`${QUICK_PROMPTS.length} curated`} />
            <QuickPromptsGrid onPick={onSuggestionClick} />
          </section>

          <section>
            <SectionHead kicker="Workspace" title="At a glance" />
            <StatStrip />
          </section>
        </div>

        {/* RIGHT rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

          <ClockCard now={now} />

          <WeatherBlock weather={data?.weather ?? null} loading={loading} />

          <section>
            <SectionHead kicker="Pick up where you left off" title="Open threads" meta="4 active" />
            <OpenThreads onPick={onSuggestionClick} />
          </section>

          <Colophon now={now} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--gv-rule)', padding: '8px 32px', display: 'flex', justifyContent: 'space-between', background: 'var(--gv-paper-2)' }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', letterSpacing: '0.06em', color: 'var(--gv-ink-4)', textTransform: 'uppercase' }}>
          Graviton can make mistakes · verify important information
        </span>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-jetbrains-mono, monospace)', letterSpacing: '0.06em', color: 'var(--gv-ink-4)' }}>
          News · BBC RSS · Weather · wttr.in
        </span>
      </div>
    </div>
  )
}
