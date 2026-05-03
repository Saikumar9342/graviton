// Main column: masthead, briefing, prompts, starters, composer.

const { useState: useS2, useEffect: useE2, useRef: useR2 } = React;

// ─── masthead — newspaper header ─────────────────────────────────────────────

function Masthead({ now, onRefresh, onTheme, dark, onSettings }) {
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const issue = `Vol. ${now.getFullYear() - 2024} · No. ${Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000)}`;
  return (
    <div style={{ padding: '20px 40px 18px', position: 'relative' }}>
      {/* top utility row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 11, color: 'var(--ink-3)',
      }}>
        <div className="mono" style={{ display: 'flex', gap: 16, letterSpacing: '0.06em' }}>
          <span>{issue}</span>
          <span style={{ opacity: .5 }}>·</span>
          <span>EST. 2024</span>
          <span style={{ opacity: .5 }}>·</span>
          <span>EDITORIAL EDITION</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton onClick={onRefresh} aria-label="Refresh">{window.Icons.refresh}</IconButton>
          <IconButton onClick={onTheme} aria-label="Theme">{dark ? window.Icons.sun : window.Icons.moon}</IconButton>
          <IconButton onClick={onSettings} aria-label="Settings">{window.Icons.settings}</IconButton>
        </div>
      </div>

      {/* big nameplate */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginTop: 10, gap: 24, flexWrap: 'wrap',
      }}>
        <div className="display" style={{
          fontSize: 'clamp(44px, 5.4vw, 76px)',
          lineHeight: 1.0,
          letterSpacing: '-0.04em',
          fontWeight: 500,
          fontVariationSettings: '"opsz" 144, "SOFT" 30',
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
        }}>
          The Daily<span style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--accent)' }}> Brief</span>
        </div>
        <div style={{ textAlign: 'right', paddingBottom: 8, flex: '0 0 auto' }}>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '0.1em' }}>DATELINE</div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>{dateStr}</div>
        </div>
      </div>

      {/* dek / subhead */}
      <div style={{
        marginTop: 18, paddingTop: 12,
        borderTop: '3px double var(--rule)',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 14.5, color: 'var(--ink-2)', maxWidth: 720, lineHeight: 1.45 }}>
          Good evening, Naia. Curated answers, working drafts, and a personalised
          <span style={{ fontStyle: 'italic', fontFamily: 'var(--font-display)' }}> briefing</span> across the topics you follow.
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
          UPDATED · {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

function IconButton({ children, onClick, ...rest }) {
  return (
    <button onClick={onClick} {...rest} style={{
      appearance: 'none', border: '1px solid var(--rule)',
      background: 'transparent', color: 'var(--ink-2)',
      width: 30, height: 30, borderRadius: 6,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', padding: 0,
    }}>{children}</button>
  );
}

// ─── topic rail ──────────────────────────────────────────────────────────────

function TopicRail({ active, setActive, topics }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderTop: '1px solid var(--rule)',
      borderBottom: '1px solid var(--rule)',
      padding: '6px 32px', gap: 0,
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      {topics.map((t, i) => (
        <React.Fragment key={t.id}>
          {i > 0 && <div style={{ width: 1, background: 'var(--rule-soft)', margin: '4px 0' }} />}
          <window.TopicChip
            active={active === t.id}
            onClick={() => setActive(t.id)}
            count={t.count}
          >
            {t.label}
          </window.TopicChip>
        </React.Fragment>
      ))}
      <div style={{ flex: 1 }} />
      <button style={{
        appearance: 'none', border: 0, background: 'transparent',
        color: 'var(--ink-3)', fontSize: 12.5, padding: '4px 8px',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
        Customise{window.Icons.plus}
      </button>
    </div>
  );
}

// ─── briefing column blocks ──────────────────────────────────────────────────

function SectionHead({ kicker, title, count, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
      <div>
        <div className="label">{kicker}</div>
        <div className="display" style={{
          fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em',
          marginTop: 2,
          fontVariationSettings: '"opsz" 144',
        }}>{title}</div>
      </div>
      {(count != null || children) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {children}
          {count != null && (
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '0.06em' }}>
              {count}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuickPrompts({ items, onPick }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      borderTop: '1px solid var(--rule)',
      borderLeft: '1px solid var(--rule)',
    }}>
      {items.map((p, i) => (
        <button key={i} onClick={() => onPick(p.title)} style={{
          appearance: 'none',
          textAlign: 'left',
          padding: '12px 14px',
          background: 'transparent',
          border: 0,
          borderRight: '1px solid var(--rule)',
          borderBottom: '1px solid var(--rule)',
          cursor: 'pointer',
          color: 'var(--ink)',
          display: 'flex', flexDirection: 'column', gap: 6,
          transition: 'background .12s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="label" style={{ color: 'var(--accent-ink)' }}>{p.tag}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>~{p.est}</span>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.35, color: 'var(--ink)', fontWeight: 500 }}>
            {p.title}
          </div>
        </button>
      ))}
    </div>
  );
}

function Starters({ items, onPick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((s, i) => (
        <button key={i} onClick={() => onPick(s.title)} style={{
          appearance: 'none', background: 'transparent', border: 0,
          padding: '12px 0',
          borderBottom: i < items.length - 1 ? '1px solid var(--rule-soft)' : 'none',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'baseline',
          gap: 14,
          color: 'var(--ink)',
        }}>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--accent-ink)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {s.hook}
          </span>
          <span style={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.35 }}>{s.title}</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>{s.meta}</span>
        </button>
      ))}
    </div>
  );
}

function ClockCard({ now }) {
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const sec = String(now.getSeconds()).padStart(2, '0');
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const day = now.toLocaleDateString(undefined, { weekday: 'long' });
  const dateStr = now.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return (
    <div style={{
      border: '1px solid var(--rule)',
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 10,
      background: 'var(--paper-2)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="label">Local Time</div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>{tz.replace('_', ' ')}</div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 6,
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        color: 'var(--ink)',
      }}>
        <span style={{ fontSize: 56, lineHeight: 0.95, letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144' }}>{time}</span>
        <span className="mono" style={{ fontSize: 14, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>:{sec}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{day}, {dateStr}</div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>
          {Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000)} / 365
        </div>
      </div>
    </div>
  );
}

function StatStrip() {
  const stats = [
    { l: 'Threads',   v: '142', d: '+3 today' },
    { l: 'Tokens',    v: '1.2M', d: '32% of plan' },
    { l: 'Saved',     v: '27',  d: 'pinned' },
    { l: 'Streak',    v: '14d', d: 'daily use' },
  ];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      borderTop: '1px solid var(--rule)',
      borderBottom: '1px solid var(--rule)',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          padding: '12px 14px',
          borderRight: i < stats.length - 1 ? '1px solid var(--rule)' : 'none',
        }}>
          <div className="label" style={{ fontSize: 9.5 }}>{s.l}</div>
          <div className="display" style={{ fontSize: 24, fontWeight: 500, marginTop: 2, letterSpacing: '-0.02em' }}>{s.v}</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>{s.d}</div>
        </div>
      ))}
    </div>
  );
}

function FeaturedThread() {
  return (
    <div style={{
      borderTop: '3px double var(--rule)',
      borderBottom: '1px solid var(--rule)',
      padding: '16px 0',
      display: 'grid', gridTemplateColumns: '1fr auto', gap: 18,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span className="label" style={{ color: 'var(--accent-ink)' }}>Editor's pick</span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>· 3 MIN READ</span>
        </div>
        <div className="display" style={{
          fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.15,
          fontVariationSettings: '"opsz" 96',
        }}>
          Resume your work on <span style={{ fontStyle: 'italic' }}>Microservice Architecture Proposal</span> — a draft of section 3 is ready for your review.
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, maxWidth: 600 }}>
          You left off comparing event-sourced vs. CRUD persistence. Graviton drafted a comparison table and three follow-up questions.
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 12, alignItems: 'center' }}>
          <button style={{
            appearance: 'none', border: 0, background: 'var(--accent)', color: 'var(--paper)',
            padding: '7px 14px', borderRadius: 4, fontSize: 12.5, fontWeight: 500,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            Continue thread {window.Icons.arrow}
          </button>
          <button style={{
            appearance: 'none', border: 0, background: 'transparent', color: 'var(--ink-2)',
            fontSize: 12.5, fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3,
          }}>
            View summary
          </button>
        </div>
      </div>
      <div style={{
        width: 110, height: 110, alignSelf: 'center',
        background: `repeating-linear-gradient(135deg, var(--paper-3), var(--paper-3) 2px, transparent 2px, transparent 6px)`,
        border: '1px solid var(--rule)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', textAlign: 'center', lineHeight: 1.3 }}>
          THREAD<br/>PREVIEW
        </div>
      </div>
    </div>
  );
}

// ─── composer ────────────────────────────────────────────────────────────────

function Composer({ tools, value, setValue, onSend }) {
  const [tool, setTool] = useS2('Versatile');
  const taRef = useR2(null);
  useE2(() => {
    if (taRef.current) {
      taRef.current.style.height = 'auto';
      taRef.current.style.height = Math.min(160, taRef.current.scrollHeight) + 'px';
    }
  }, [value]);

  return (
    <div style={{
      border: '1px solid var(--ink)',
      background: 'var(--paper)',
      borderRadius: 4,
      boxShadow: '4px 4px 0 var(--rule)',
    }}>
      {/* tool row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px',
        borderBottom: '1px solid var(--rule)',
      }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {tools.map((t, i) => (
            <button key={t.name} onClick={() => setTool(t.name)} style={{
              appearance: 'none', border: 0, background: 'transparent',
              padding: '4px 10px',
              fontSize: 12, fontWeight: tool === t.name ? 600 : 500,
              color: tool === t.name ? 'var(--ink)' : 'var(--ink-3)',
              cursor: 'pointer',
              borderRight: i < tools.length - 1 ? '1px solid var(--rule-soft)' : 'none',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.02em',
              position: 'relative',
              textTransform: 'uppercase',
            }}>
              {tool === t.name && (
                <span style={{
                  position: 'absolute', left: 6, top: 6, width: 4, height: 4,
                  background: 'var(--accent)', borderRadius: '50%',
                }}/>
              )}
              <span style={{ paddingLeft: tool === t.name ? 6 : 0 }}>{t.name}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-3)' }}>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '0.06em' }}>
            {tools.find(t => t.name === tool)?.sub}
          </span>
        </div>
      </div>

      {/* textarea */}
      <textarea
        ref={taRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        placeholder="Ask anything, or paste a link, image, or file."
        rows={2}
        style={{
          width: '100%', resize: 'none',
          border: 0, outline: 0, background: 'transparent',
          padding: '14px 16px',
          fontFamily: 'var(--font-body)', fontSize: 15.5, lineHeight: 1.5,
          color: 'var(--ink)',
          minHeight: 56,
        }}
      />

      {/* bottom row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px',
        borderTop: '1px solid var(--rule)',
        background: 'var(--paper-2)',
      }}>
        <div style={{ display: 'flex', gap: 6, color: 'var(--ink-3)' }}>
          <IconButton aria-label="Attach">{window.Icons.attach}</IconButton>
          <IconButton aria-label="Web">{window.Icons.globe}</IconButton>
          <IconButton aria-label="Image">{window.Icons.spark}</IconButton>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
            {value.length} char · ⌘↵ to send
          </span>
          <button onClick={onSend} disabled={!value.trim()} style={{
            appearance: 'none', border: 0,
            background: value.trim() ? 'var(--ink)' : 'var(--paper-3)',
            color: value.trim() ? 'var(--paper)' : 'var(--ink-4)',
            padding: '7px 14px', borderRadius: 3,
            fontSize: 12.5, fontWeight: 600,
            cursor: value.trim() ? 'pointer' : 'not-allowed',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            Send {window.Icons.send}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Masthead, TopicRail, SectionHead, QuickPrompts, Starters, ClockCard, StatStrip, FeaturedThread, Composer, IconButton });
