'use client';
// components/claim/AnalyzeStep.tsx

import { useEffect, useState } from 'react';

interface Props {
  fileName?: string;
  onDone: () => void;
}

const PHASES = [
  { label: 'Extracting text from EOB…',           icon: '📄' },
  { label: 'Parsing line items & dates…',          icon: '🔍' },
  { label: 'Decoding CPT codes…',                  icon: '⚕️' },
  { label: 'Decoding ICD-10 diagnosis codes…',     icon: '🧬' },
  { label: 'Decoding CARC denial codes…',          icon: '🚫' },
  { label: 'Cross-referencing insurer policy…',    icon: '📋' },
  { label: 'Building appeal strategy…',            icon: '⚖️' },
  { label: 'Analysis complete.',                   icon: '✅' },
];

const CODE_FLASHES = [
  { raw: 'CO-4',    decoded: 'Not covered for diagnosis' },
  { raw: 'CO-97',   decoded: "Bundled — but they're wrong" },
  { raw: '47562',   decoded: 'Lap. cholecystectomy' },
  { raw: 'K80.20',  decoded: 'Gallstone disease' },
  { raw: '99213',   decoded: 'Office visit (pre-op)' },
  { raw: 'Z01.810', decoded: 'Pre-op EKG exam' },
];

export function AnalyzeStep({ fileName = 'EOB_document.pdf', onDone }: Props) {
  const [phase, setPhase]           = useState(0);
  const [progress, setProgress]     = useState(0);
  const [visibleCount, setVisible]  = useState(0);

  useEffect(() => {
    let p = 0;
    const id = setInterval(() => {
      p += 1.4;
      const clamped = Math.min(p, 100);
      setProgress(clamped);
      setPhase(Math.min(Math.floor(clamped / 13), PHASES.length - 1));
      setVisible(Math.floor((clamped / 100) * CODE_FLASHES.length));
      if (p >= 100) { clearInterval(id); setTimeout(onDone, 700); }
    }, 40);
    return () => clearInterval(id);
  }, [onDone]);

  const pct = Math.round(progress);

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.topRow}>
          <div style={S.spinner} />
          <div>
            <div style={S.title}>Analyzing your claim</div>
            <div style={S.sub}>{fileName}</div>
          </div>
          <div style={S.pct}>{pct}%</div>
        </div>

        <div style={S.track}>
          <div style={{ ...S.bar, width: `${pct}%` }} />
        </div>

        <div style={S.phaseRow}>
          <span>{PHASES[phase].icon}</span>
          <span style={S.phaseText}>{PHASES[phase].label}</span>
        </div>

        <div style={S.codeGrid}>
          {CODE_FLASHES.map((item, i) => (
            <div
              key={i}
              style={{
                ...S.codeChip,
                opacity:   visibleCount > i ? 1 : 0,
                transform: visibleCount > i ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 0.3s ease',
              }}
            >
              <span style={S.codeRaw}>{item.raw}</span>
              <span style={S.codeArrow}>→</span>
              <span style={S.codeDecoded}>{item.decoded}</span>
            </div>
          ))}
        </div>

        <div style={S.hipaaBar}>
          <span>🔒</span>
          <span>Your data is encrypted and never stored beyond 24 hours</span>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:      { display:'flex', alignItems:'center', justifyContent:'center', minHeight:'80vh', padding:32 },
  card:      { background:'#fff', borderRadius:24, border:'1px solid oklch(0.91 0.02 268)', padding:40, maxWidth:560, width:'100%', boxShadow:'0 4px 40px oklch(0.25 0.15 268 / 0.08)' },
  topRow:    { display:'flex', alignItems:'center', gap:16, marginBottom:28 },
  spinner:   { width:44, height:44, borderRadius:'50%', border:'3px solid oklch(0.91 0.02 268)', borderTopColor:'oklch(0.25 0.15 268)', animation:'spin 0.8s linear infinite', flexShrink:0 },
  title:     { fontSize:20, fontWeight:700, color:'oklch(0.18 0.02 250)', marginBottom:2 },
  sub:       { fontSize:13, color:'oklch(0.55 0.05 268)' },
  pct:       { marginLeft:'auto', fontFamily:'"DM Serif Display", Georgia, serif', fontSize:32, color:'oklch(0.25 0.15 268)', fontWeight:400 },
  track:     { height:6, background:'oklch(0.93 0.02 268)', borderRadius:999, overflow:'hidden', marginBottom:16 },
  bar:       { height:'100%', background:'linear-gradient(90deg, oklch(0.25 0.15 268), oklch(0.60 0.15 192))', borderRadius:999, transition:'width 0.1s linear' },
  phaseRow:  { display:'flex', alignItems:'center', gap:10, fontSize:14, color:'oklch(0.45 0.05 268)', marginBottom:28, minHeight:22 },
  phaseText: { fontWeight:500 },
  codeGrid:  { display:'flex', flexDirection:'column', gap:8, marginBottom:28 },
  codeChip:  { display:'flex', alignItems:'center', gap:10, background:'oklch(0.97 0.01 268)', borderRadius:10, padding:'10px 16px', border:'1px solid oklch(0.91 0.02 268)' },
  codeRaw:   { fontFamily:'monospace', fontSize:13, fontWeight:700, color:'oklch(0.55 0.18 22)', background:'oklch(0.55 0.18 22 / 0.08)', padding:'2px 8px', borderRadius:6 },
  codeArrow: { color:'oklch(0.7 0.05 268)', fontSize:14 },
  codeDecoded:{ fontSize:13, color:'oklch(0.35 0.05 268)', fontWeight:500 },
  hipaaBar:  { display:'flex', alignItems:'center', gap:8, fontSize:12, color:'oklch(0.6 0.05 268)', borderTop:'1px solid oklch(0.93 0.02 268)', paddingTop:16 },
};
