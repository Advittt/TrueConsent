'use client';

import { useNarrow } from '@/lib/use-narrow';

interface Props {
  onStart: () => void;
}

export function UploadStep({ onStart }: Props) {
  const narrow = useNarrow(600);
  return (
    <div style={S.page}>
      <div style={S.hero}>
        <div style={S.badge}>AI-Powered EOB Decoder</div>
        <h1 style={S.headline}>
          1 in 5 claims gets denied.<br />
          <span style={S.accent}>7 in 10 win on appeal.</span>
        </h1>
        <p style={S.sub}>
          Less than 1% of people ever challenge a denial — even though most win when they do.
          That&apos;s <strong style={{ color:'oklch(0.45 0.18 22)' }}>$265 billion</strong> sitting on the table.
          We built TrueConsent to pick it up.
        </p>

        <button style={S.cta} onClick={onStart}>
          <span style={S.ctaTitle}>Watch the demo</span>
          <span style={S.ctaSub}>See how Sarah recovered $3,847 from BCBS in 25 seconds</span>
        </button>

        <div style={S.trustRow}>
          {['HIPAA compliant', '256-bit encryption', 'Files deleted after 24h'].map((t) => (
            <div key={t} style={S.trustItem}>
              <span style={S.trustDot} />
              {t}
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...S.statsRow, gridTemplateColumns: narrow ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
        {[
          { n: '1 in 5',  l: 'claims denied by insurers' },
          { n: '70%',     l: '"not medically necessary" denials overturned on appeal' },
          { n: '$265B',   l: 'fought by hospitals & patients every year' },
          { n: '<1%',     l: 'of people ever appeal — most win when they do' },
        ].map(({ n, l }) => (
          <div key={n} style={S.statCard}>
            <div style={S.statNum}>{n}</div>
            <div style={S.statLabel}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:       { display:'flex', flexDirection:'column', alignItems:'center', padding:'0 24px 64px', maxWidth:720, margin:'0 auto' },
  hero:       { width:'100%', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', paddingTop:72 },
  badge:      { display:'inline-block', background:'oklch(0.25 0.15 268 / 0.08)', color:'oklch(0.35 0.15 268)', border:'1px solid oklch(0.35 0.15 268 / 0.2)', borderRadius:999, padding:'6px 16px', fontSize:12, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:24 },
  headline:   { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:'clamp(36px, 6vw, 58px)', fontWeight:400, lineHeight:1.15, color:'oklch(0.18 0.02 250)', margin:'0 0 20px', letterSpacing:'-0.02em' },
  accent:     { color:'oklch(0.55 0.18 22)' },
  sub:        { fontSize:18, color:'oklch(0.45 0.02 250)', lineHeight:1.7, maxWidth:520, margin:'0 0 40px' },
  cta:        { background:'oklch(0.25 0.15 268)', color:'#fff', border:'none', borderRadius:16, padding:'20px 36px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6, transition:'all 0.15s', boxShadow:'0 10px 30px oklch(0.25 0.15 268 / 0.25)' },
  ctaTitle:   { fontSize:18, fontWeight:700, letterSpacing:'-0.01em' },
  ctaSub:     { fontSize:13, color:'oklch(0.85 0.07 268)', fontWeight:500 },
  trustRow:   { display:'flex', gap:24, marginTop:28, flexWrap:'wrap', justifyContent:'center' },
  trustItem:  { display:'flex', alignItems:'center', gap:6, fontSize:13, color:'oklch(0.55 0.05 268)' },
  trustDot:   { width:6, height:6, borderRadius:'50%', background:'oklch(0.52 0.14 142)', display:'inline-block' },
  statsRow:   { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, width:'100%', marginTop:64 },
  statCard:   { background:'#fff', borderRadius:16, padding:'20px 16px', textAlign:'center', border:'1px solid oklch(0.91 0.02 268)' },
  statNum:    { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:28, fontWeight:400, color:'oklch(0.25 0.15 268)', marginBottom:4 },
  statLabel:  { fontSize:13, color:'oklch(0.55 0.05 268)', lineHeight:1.4 },
};
