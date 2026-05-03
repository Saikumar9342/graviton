// Graviton — editorial dashboard.

const { useState: uS, useEffect: uE, useMemo: uM } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": true,
  "accent": "#D9601E",
  "fontPair": "fraunces-inter",
  "density": "balanced",
  "layout": "split",
  "showClock": true,
  "showStats": true,
  "showFeatured": true,
  "showStarters": true,
  "showPrompts": true,
  "showTopics": true,
  "newspaperHeader": true
}/*EDITMODE-END*/;

const FONT_PAIRS = {
  'fraunces-inter':   { display: 'Fraunces',         body: 'Inter',     mono: 'JetBrains Mono', label: 'Fraunces · Inter' },
  'instrument-dm':    { display: 'Instrument Serif', body: 'DM Sans',   mono: 'IBM Plex Mono',  label: 'Instrument · DM Sans' },
  'spectral-inter':   { display: 'Spectral',         body: 'Inter',     mono: 'JetBrains Mono', label: 'Spectral · Inter' },
  'fraunces-dm':      { display: 'Fraunces',         body: 'DM Sans',   mono: 'IBM Plex Mono',  label: 'Fraunces · DM Sans' },
};

const DENSITIES = {
  compact:  { gap: 14, pad: 14, fs: 13   },
  balanced: { gap: 18, pad: 20, fs: 13.5 },
  airy:     { gap: 28, pad: 28, fs: 14.5 },
};

function App() {
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [now, setNow] = uS(new Date());
  const [activeTopic, setActiveTopic] = uS('world');
  const [collapsed, setCollapsed] = uS(false);
  const [composerValue, setComposerValue] = uS('');

  uE(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  uE(() => {
    document.documentElement.classList.toggle('dark', !!t.dark);
  }, [t.dark]);

  const fonts = FONT_PAIRS[t.fontPair] || FONT_PAIRS['fraunces-inter'];
  const density = DENSITIES[t.density] || DENSITIES.balanced;

  uE(() => {
    const r = document.documentElement.style;
    r.setProperty('--font-display', `'${fonts.display}'`);
    r.setProperty('--font-body',    `'${fonts.body}'`);
    r.setProperty('--font-mono',    `'${fonts.mono}'`);
    r.setProperty('--accent',       t.accent);
  }, [fonts, t.accent]);

  const handleSend = () => {
    if (!composerValue.trim()) return;
    setComposerValue('');
  };

  return (
    <div style={{
      display: 'flex', height: '100vh', minHeight: 0,
      background: 'var(--paper)', color: 'var(--ink)',
    }}>
      <window.Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} density={t.density} />

      <main data-screen-label="01 Home" style={{
        flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* scroll body */}
        <div style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          scrollbarWidth: 'thin',
        }}>
          {t.newspaperHeader && (
            <window.Masthead
              now={now}
              dark={t.dark}
              onRefresh={() => setNow(new Date())}
              onTheme={() => setTweak('dark', !t.dark)}
              onSettings={() => {}}
            />
          )}

          {t.showTopics && (
            <window.TopicRail
              topics={window.TOPICS}
              active={activeTopic}
              setActive={setActiveTopic}
            />
          )}

          {/* main grid */}
          <div style={{
            padding: `${density.pad}px 40px ${density.pad + 24}px`,
            display: 'grid',
            gridTemplateColumns: t.layout === 'single' ? '1fr' : 'minmax(0, 1.35fr) minmax(0, 1fr)',
            gap: 36,
          }}>
            {/* LEFT — lead */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap, minWidth: 0 }}>

              {t.showFeatured && <window.FeaturedThread />}

              {t.showPrompts && (
                <section>
                  <window.SectionHead kicker="Quick Prompts" title="Start a thread" count={`${window.QUICK_PROMPTS.length} curated`}>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '0.06em' }}>UPDATED HOURLY</span>
                  </window.SectionHead>
                  <window.QuickPrompts items={window.QUICK_PROMPTS} onPick={setComposerValue} />
                </section>
              )}

              {t.showStats && (
                <section>
                  <window.SectionHead kicker="Workspace" title="At a glance" />
                  <window.StatStrip />
                </section>
              )}
            </div>

            {/* RIGHT — rail */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap, minWidth: 0 }}>
              {t.showClock && <window.ClockCard now={now} />}

              {t.showStarters && (
                <section>
                  <window.SectionHead kicker="Pick up where you left off" title="Open threads" count={`${window.STARTERS.length} active`} />
                  <window.Starters items={window.STARTERS} onPick={setComposerValue} />
                </section>
              )}

              {/* spec sheet — masthead-style colophon */}
              <section style={{
                border: '1px solid var(--rule)',
                padding: '14px 16px',
                background: 'var(--paper-2)',
              }}>
                <div className="label" style={{ marginBottom: 8 }}>Colophon</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 14px', fontSize: 12, color: 'var(--ink-2)' }}>
                  <span className="mono" style={{ color: 'var(--ink-4)', fontSize: 10.5 }}>MODEL</span>
                  <span>Graviton 4 · Versatile</span>
                  <span className="mono" style={{ color: 'var(--ink-4)', fontSize: 10.5 }}>CONTEXT</span>
                  <span>200K tokens · 12% used</span>
                  <span className="mono" style={{ color: 'var(--ink-4)', fontSize: 10.5 }}>MEMORY</span>
                  <span>On · synced 2m ago</span>
                  <span className="mono" style={{ color: 'var(--ink-4)', fontSize: 10.5 }}>TONE</span>
                  <span style={{ fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>Editorial, concise</span>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* sticky composer */}
        <div style={{
          padding: '10px 40px 18px',
          borderTop: '1px solid var(--rule)',
          background: 'linear-gradient(to bottom, transparent, var(--paper) 12px)',
        }}>
          <window.Composer
            tools={window.TOOLS}
            value={composerValue}
            setValue={setComposerValue}
            onSend={handleSend}
          />
          <div style={{
            marginTop: 8, display: 'flex', justifyContent: 'space-between',
            color: 'var(--ink-4)', fontSize: 11,
          }}>
            <span className="mono" style={{ letterSpacing: '0.06em' }}>
              GRAVITON CAN MAKE MISTAKES · VERIFY IMPORTANT INFORMATION
            </span>
            <span className="mono" style={{ letterSpacing: '0.06em' }}>
              v4.2.1 · {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          </div>
        </div>
      </main>

      {/* TWEAKS */}
      <window.TweaksPanel>
        <window.TweakSection label="Theme" />
        <window.TweakToggle label="Dark mode" value={t.dark} onChange={v => setTweak('dark', v)} />
        <window.TweakColor  label="Accent"    value={t.accent} onChange={v => setTweak('accent', v)} />

        <window.TweakSection label="Typography" />
        <window.TweakSelect
          label="Font pair"
          value={t.fontPair}
          options={Object.entries(FONT_PAIRS).map(([v, p]) => ({ value: v, label: p.label }))}
          onChange={v => setTweak('fontPair', v)}
        />

        <window.TweakSection label="Layout" />
        <window.TweakRadio
          label="Layout"
          value={t.layout}
          options={['split', 'single']}
          onChange={v => setTweak('layout', v)}
        />
        <window.TweakRadio
          label="Density"
          value={t.density}
          options={['compact', 'balanced', 'airy']}
          onChange={v => setTweak('density', v)}
        />
        <window.TweakToggle label="Newspaper masthead" value={t.newspaperHeader} onChange={v => setTweak('newspaperHeader', v)} />

        <window.TweakSection label="Modules" />
        <window.TweakToggle label="Topic rail"     value={t.showTopics}    onChange={v => setTweak('showTopics', v)} />
        <window.TweakToggle label="Featured thread" value={t.showFeatured} onChange={v => setTweak('showFeatured', v)} />
        <window.TweakToggle label="Quick prompts"  value={t.showPrompts}   onChange={v => setTweak('showPrompts', v)} />
        <window.TweakToggle label="Stat strip"     value={t.showStats}     onChange={v => setTweak('showStats', v)} />
        <window.TweakToggle label="Local clock"    value={t.showClock}     onChange={v => setTweak('showClock', v)} />
        <window.TweakToggle label="Open threads"   value={t.showStarters}  onChange={v => setTweak('showStarters', v)} />
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
