// Components for the Graviton editorial dashboard.

const { useState, useEffect, useRef, useMemo } = React;

// ─── tiny atoms ──────────────────────────────────────────────────────────────

function Rule({ vertical, style }) {
  return (
    <div
      style={{
        background: 'var(--rule)',
        ...(vertical
          ? { width: 1, alignSelf: 'stretch' }
          : { height: 1, width: '100%' }),
        ...style,
      }}
    />
  );
}

function Dot({ size = 4, color = 'currentColor', style }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size, height: size,
        borderRadius: '50%',
        background: color,
        ...style,
      }}
    />
  );
}

// ─── icons (very minimal, line-only) ─────────────────────────────────────────

const Icon = ({ d, size = 14, stroke = 1.5, fill = 'none', viewBox = '0 0 24 24' }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const Icons = {
  search:    <Icon d="M11 19a8 8 0 1 1 5.3-2L21 21" />,
  plus:      <Icon d="M12 5v14M5 12h14" />,
  send:      <Icon d="M5 12h14M13 6l6 6-6 6" />,
  attach:    <Icon d="M21 12.5 12.5 21a5 5 0 0 1-7-7L14 5.5a3.5 3.5 0 0 1 5 5L10.5 19" />,
  globe:     <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>} />,
  chevR:     <Icon d="M9 6l6 6-6 6" />,
  chevL:     <Icon d="M15 6l-6 6 6 6" />,
  chevD:     <Icon d="M6 9l6 6 6-6" />,
  sun:       <Icon d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></>} />,
  moon:      <Icon d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  settings:  <Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>} />,
  refresh:   <Icon d={<><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5"/></>} />,
  star:      <Icon d="M12 3l2.6 5.6 6 .9-4.3 4.4 1 6.3L12 17l-5.3 3.2 1-6.3L3.4 9.5l6-.9z" />,
  arrow:     <Icon d="M5 12h14M13 5l7 7-7 7" />,
  pin:       <Icon d="M12 2v8M5 14h14l-1 7H6zM12 14v7" />,
  dot:       <Icon d={<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>} />,
  bookmark:  <Icon d="M6 3h12v18l-6-4-6 4z" />,
  spark:     <Icon d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3" />,
};

// ─── topic chip ──────────────────────────────────────────────────────────────

function TopicChip({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: 'none',
        border: '0',
        background: 'transparent',
        padding: '4px 10px 6px',
        margin: 0,
        color: active ? 'var(--ink)' : 'var(--ink-3)',
        cursor: 'pointer',
        position: 'relative',
        fontFamily: 'var(--font-body), sans-serif',
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
        letterSpacing: '-0.005em',
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 6,
        whiteSpace: 'nowrap',
      }}
    >
      <span>{children}</span>
      <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', fontWeight: 500 }}>{count}</span>
      {active && (
        <span style={{
          position: 'absolute', left: 8, right: 8, bottom: -1, height: 2,
          background: 'var(--accent)',
        }} />
      )}
    </button>
  );
}

// ─── sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ collapsed, onToggle, density }) {
  return (
    <aside style={{
      width: collapsed ? 56 : 248,
      flex: '0 0 auto',
      borderRight: '1px solid var(--rule)',
      background: 'var(--paper-2)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width .25s ease',
      overflow: 'hidden',
    }}>
      {/* masthead */}
      <div style={{
        padding: collapsed ? '14px 12px' : '16px 18px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <div className="display" style={{
              fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em',
              fontVariationSettings: '"opsz" 144',
            }}>
              Graviton
            </div>
            <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.08em' }}>
              ™
            </div>
          </div>
        )}
        <button onClick={onToggle} style={{
          appearance: 'none', border: 0, background: 'transparent',
          color: 'var(--ink-3)', cursor: 'pointer', padding: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {collapsed ? Icons.chevR : Icons.chevL}
        </button>
      </div>
      <Rule />

      {/* search */}
      {!collapsed && (
        <div style={{ padding: '12px 14px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px',
            border: '1px solid var(--rule)',
            borderRadius: 6,
            background: 'var(--paper)',
            color: 'var(--ink-3)',
          }}>
            {Icons.search}
            <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>Search threads</span>
            <span className="mono" style={{
              marginLeft: 'auto', fontSize: 10, color: 'var(--ink-4)',
              border: '1px solid var(--rule)', borderRadius: 3, padding: '1px 5px',
            }}>⌘K</span>
          </div>
        </div>
      )}

      {/* new chat */}
      {!collapsed && (
        <div style={{ padding: '10px 14px 4px' }}>
          <button style={{
            appearance: 'none', width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 12px',
            background: 'var(--ink)',
            color: 'var(--paper)',
            border: 0,
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13.5, fontWeight: 500,
            letterSpacing: '-0.005em',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {Icons.plus}
              New thread
            </span>
            <span className="mono" style={{ fontSize: 10, opacity: .6 }}>⌘N</span>
          </button>
        </div>
      )}

      {/* projects */}
      {!collapsed && (
        <div style={{ padding: '14px 14px 6px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 4px 8px',
          }}>
            <div className="label">Projects</div>
            <button style={{
              appearance: 'none', border: 0, background: 'transparent',
              color: 'var(--ink-4)', cursor: 'pointer', padding: 0, lineHeight: 0,
            }}>{Icons.plus}</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {window.PROJECTS.map(p => (
              <div key={p.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '5px 4px', fontSize: 13, color: 'var(--ink-2)',
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: 1,
                    background: 'var(--accent)', opacity: .7,
                  }} />
                  {p.name}
                </span>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* history */}
      {!collapsed && (
        <div style={{ padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
          <div style={{ padding: '8px 4px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="label">Recent</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{window.HISTORY.length}</div>
          </div>
          <div style={{
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            flex: 1,
          }}>
            {window.HISTORY.map((h, i) => (
              <div key={i} style={{
                padding: '6px 6px',
                fontSize: 13,
                color: i === 0 ? 'var(--ink)' : 'var(--ink-2)',
                background: i === 0 ? 'var(--paper-3)' : 'transparent',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: i === 0 ? 500 : 400,
                cursor: 'pointer',
              }}>
                {h}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* footer / user */}
      <Rule />
      <div style={{
        padding: collapsed ? '12px 8px' : '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--accent)', color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
          flex: '0 0 auto',
        }}>N</div>
        {!collapsed && (
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.2 }}>Naia Okonkwo</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>PRO · 14d trial</div>
          </div>
        )}
      </div>
    </aside>
  );
}

Object.assign(window, { Sidebar, TopicChip, Rule, Dot, Icon, Icons });
