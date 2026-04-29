'use client';
// components/claim/AppealStep.tsx

import { useEffect, useRef, useState } from 'react';
import type { AppealLetter } from '@/lib/types/claim';

interface Props {
  appeal: AppealLetter;
  insurerName: string;
  onCall: () => void;
}

export function AppealStep({ appeal, insurerName, onCall }: Props) {
  const [lines, setLines]       = useState<string[]>([]);
  const [generating, setGen]    = useState(true);
  const [copied, setCopied]     = useState(false);
  const scrollRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allLines = (appeal.content ?? '').split('\n');
    let i = 0;
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout>;

    setLines([]);
    setGen(true);

    const tick = () => {
      if (cancelled) return;
      if (i >= allLines.length) { setGen(false); return; }
      const cur = allLines[i] ?? '';
      setLines(prev => [...prev, cur]);
      const delay = cur === '' ? 80 : cur.startsWith('━') ? 200 : 55;
      i++;
      timerId = setTimeout(tick, delay);
    };

    timerId = setTimeout(tick, 400);
    return () => {
      cancelled = true;
      clearTimeout(timerId);
    };
  }, [appeal.content]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const handleCopy = () => {
    navigator.clipboard.writeText(appeal.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([appeal.content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `TrueConsent_Appeal_${appeal.claimId}.txt`;
    a.click();
  };

  return (
    <div style={S.page}>
      <div style={S.layout}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          <div style={S.card}>
            <div style={S.cardTitle}>Appeal Summary</div>
            {[
              { l: 'Insurer', v: insurerName },
              { l: 'Claim',   v: appeal.claimId },
              { l: 'Grounds', v: `${appeal.grounds} denial${appeal.grounds !== 1 ? 's' : ''}` },
              { l: 'Amount',  v: '—' },
            ].map(({ l, v }) => (
              <div key={l} style={S.row}>
                <span style={S.rowLabel}>{l}</span>
                <span style={S.rowVal}>{v}</span>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>Legal Citations</div>
            {appeal.citations.map(c => (
              <div key={c} style={S.citChip}>{c}</div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.cardTitle}>Next Steps</div>
            {[
              { n: '1', t: 'Send letter', s: `Mail or upload via ${insurerName} portal` },
              { n: '2', t: 'Auto-call insurer', s: 'We call and follow up for you' },
              { n: '3', t: 'Track response', s: '30-day response window' },
            ].map(st => (
              <div key={st.n} style={S.step}>
                <div style={S.stepN}>{st.n}</div>
                <div>
                  <div style={S.stepTitle}>{st.t}</div>
                  <div style={S.stepSub}>{st.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Letter panel */}
        <div style={S.letterPanel}>
          <div style={S.letterHeader}>
            <div style={S.status}>
              {generating
                ? <><span style={S.pulse} /> <span style={{ color: 'oklch(0.55 0.15 268)' }}>Writing appeal letter…</span></>
                : <span style={{ color: 'oklch(0.52 0.14 142)' }}>✓ Appeal letter ready</span>
              }
            </div>
            <div style={S.actions}>
              <button style={S.btn} onClick={handleCopy}>{copied ? '✓ Copied' : 'Copy text'}</button>
              <button style={S.btnPrimary} onClick={handleDownload}>Download .txt</button>
            </div>
          </div>

          <div style={S.letterBody} ref={scrollRef}>
            {lines.map((line, i) => {
              const l         = line ?? '';
              const isSection = l.startsWith('━━');
              const isMeta    = /^(RE:|Date:|Member:)/.test(l);
              const isClosing = /^(Sincerely|Sarah)/.test(l);
              return (
                <div key={i} style={isSection ? S.lSection : isMeta ? S.lMeta : isClosing ? S.lClosing : S.lLine}>
                  {l || ' '}
                </div>
              );
            })}
            {generating && <span style={S.cursor}>|</span>}
          </div>

          {!generating && (
            <div style={S.footer}>
              <div style={S.footerStats}>
                {[
                  { n: appeal.citations.length, l: 'citations' },
                  { n: appeal.grounds,          l: 'grounds' },
                  { n: `${appeal.winRate}%`,    l: 'win rate' },
                ].map(({ n, l }) => (
                  <div key={l} style={S.stat}>
                    <div style={S.statN}>{n}</div>
                    <div style={S.statL}>{l}</div>
                  </div>
                ))}
              </div>
              <button style={S.callBtn} onClick={onCall}>
                📞 Call {insurerName} now →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:        { maxWidth:1060, margin:'0 auto', padding:'40px 24px 80px' },
  layout:      { display:'grid', gridTemplateColumns:'260px 1fr', gap:24, alignItems:'start' },
  sidebar:     { display:'flex', flexDirection:'column', gap:16 },
  card:        { background:'#fff', border:'1px solid oklch(0.91 0.02 268)', borderRadius:16, padding:'18px 20px' },
  cardTitle:   { fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'oklch(0.55 0.05 268)', marginBottom:12 },
  row:         { display:'flex', justifyContent:'space-between', marginBottom:8 },
  rowLabel:    { fontSize:12, color:'oklch(0.6 0.05 268)' },
  rowVal:      { fontSize:13, fontWeight:600, color:'oklch(0.22 0.05 268)' },
  citChip:     { fontFamily:'monospace', fontSize:11, color:'oklch(0.35 0.15 268)', background:'oklch(0.35 0.15 268 / 0.07)', border:'1px solid oklch(0.35 0.15 268 / 0.15)', borderRadius:6, padding:'4px 8px', marginBottom:6, display:'block' },
  step:        { display:'flex', gap:10, alignItems:'flex-start', marginBottom:12 },
  stepN:       { width:22, height:22, borderRadius:'50%', background:'oklch(0.25 0.15 268)', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 },
  stepTitle:   { fontSize:13, fontWeight:600, color:'oklch(0.22 0.05 268)', marginBottom:1 },
  stepSub:     { fontSize:12, color:'oklch(0.6 0.05 268)' },
  letterPanel: { background:'#fff', border:'1px solid oklch(0.91 0.02 268)', borderRadius:20, overflow:'hidden', display:'flex', flexDirection:'column' },
  letterHeader:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 24px', borderBottom:'1px solid oklch(0.93 0.02 268)', background:'oklch(0.98 0.01 268)' },
  status:      { fontSize:14, fontWeight:600, display:'flex', alignItems:'center', gap:8, color:'oklch(0.35 0.05 268)' },
  pulse:       { display:'inline-block', width:8, height:8, borderRadius:'50%', background:'oklch(0.55 0.15 268)', animation:'pulse 1s ease-in-out infinite' },
  actions:     { display:'flex', gap:8 },
  btn:         { background:'none', border:'1px solid oklch(0.85 0.05 268)', borderRadius:8, padding:'7px 14px', fontSize:13, color:'oklch(0.45 0.05 268)', cursor:'pointer' },
  btnPrimary:  { background:'oklch(0.25 0.15 268)', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, color:'#fff', cursor:'pointer', fontWeight:600 },
  letterBody:  { padding:'28px 32px', fontFamily:'"DM Mono","Courier New",monospace', fontSize:13, lineHeight:1.75, color:'oklch(0.22 0.02 250)', maxHeight:480, overflowY:'auto', flex:1 },
  lLine:       {},
  lMeta:       { color:'oklch(0.5 0.05 268)', fontSize:12 },
  lSection:    { fontWeight:700, color:'oklch(0.25 0.15 268)', fontSize:12, letterSpacing:'0.02em' },
  lClosing:    { fontStyle:'italic', color:'oklch(0.35 0.05 268)' },
  cursor:      { display:'inline-block', animation:'blink 0.8s step-end infinite', color:'oklch(0.25 0.15 268)' },
  footer:      { borderTop:'1px solid oklch(0.93 0.02 268)', padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'oklch(0.98 0.01 268)' },
  footerStats: { display:'flex', gap:24 },
  stat:        { display:'flex', flexDirection:'column', alignItems:'center' },
  statN:       { fontFamily:'"DM Serif Display",Georgia,serif', fontSize:20, color:'oklch(0.25 0.15 268)' },
  statL:       { fontSize:11, color:'oklch(0.6 0.05 268)', textTransform:'uppercase', letterSpacing:'0.06em' },
  callBtn:     { background:'oklch(0.52 0.14 142)', color:'#fff', border:'none', borderRadius:12, padding:'12px 22px', fontSize:14, fontWeight:700, cursor:'pointer' },
};
