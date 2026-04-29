'use client';
// components/claim/ResultsStep.tsx

import { useState, useEffect } from 'react';
import type { ClaimResult, DenialStrength } from '@/lib/types/claim';

interface Props {
  claim: ClaimResult;
  onAppeal: () => void;
}

const fmt = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STRENGTH_COLOR: Record<DenialStrength, string> = {
  strong:   'oklch(0.52 0.14 142)',
  moderate: 'oklch(0.72 0.15 72)',
  weak:     'oklch(0.55 0.18 22)',
  paid:     'oklch(0.52 0.14 142)',
};
const STRENGTH_LABEL: Record<DenialStrength, string> = {
  strong:   'Strong case',
  moderate: 'Moderate case',
  weak:     'Weak case',
  paid:     'Paid',
};

export function ResultsStep({ claim, onAppeal }: Props) {
  const [expanded, setExpanded] = useState<string | null>(claim.denials?.[0]?.id ?? null);
  const [visible, setVisible]   = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  const activeDenials = claim.denials.filter(d => d.strength !== 'paid');
  const paidItems     = claim.denials.filter(d => d.strength === 'paid');

  return (
    <div style={{ ...S.page, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(16px)', transition: 'all 0.4s ease' }}>

      {/* Banner */}
      <div style={S.banner}>
        <div>
          <div style={S.bannerEye}>Claim Analysis Complete</div>
          <div style={S.bannerHeadline}>
            <span style={S.bannerAmt}>{fmt(claim.totalDenied)}</span> wrongfully withheld
          </div>
          <div style={S.bannerSub}>{activeDenials.length} appealable denial{activeDenials.length !== 1 ? 's' : ''} found in claim #{claim.claimNumber}</div>
        </div>
        <div style={S.bannerRight}>
          {[
            { n: fmt(claim.totalBilled), l: 'Billed', c: '#fff' },
            { n: fmt(claim.totalPaid),   l: 'Paid',   c: 'oklch(0.72 0.14 142)' },
            { n: fmt(claim.totalDenied), l: 'Denied', c: 'oklch(0.85 0.18 55)' },
          ].map(({ n, l, c }) => (
            <div key={l} style={S.miniStat}>
              <div style={{ ...S.miniN, color: c }}>{n}</div>
              <div style={S.miniL}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Meta strip */}
      <div style={S.metaRow}>
        {[
          { l: 'Patient',         v: claim.patient },
          { l: 'Member ID',       v: claim.memberId },
          { l: 'Insurer',         v: claim.insurer },
          { l: 'Date of Service', v: claim.dateOfService },
          { l: 'Provider',        v: claim.provider },
        ].map(({ l, v }) => (
          <div key={l} style={S.metaItem}>
            <div style={S.metaLabel}>{l}</div>
            <div style={S.metaValue}>{v}</div>
          </div>
        ))}
      </div>

      <div style={S.sectionHeader}>
        <h2 style={S.sectionTitle}>Denial Analysis</h2>
        <div style={S.sectionSub}>We found errors in each denial below. Click to expand.</div>
      </div>

      {/* Denial cards */}
      {activeDenials.map((d) => (
        <div
          key={d.id}
          style={{ ...S.denialCard, ...(expanded === d.id ? S.denialCardOpen : {}) }}
          onClick={() => setExpanded(expanded === d.id ? null : d.id)}
        >
          <div style={S.denialHead}>
            <div style={S.denialLeft}>
              <div style={S.codeTag}>{d.carc}</div>
              <div>
                <div style={S.denialTitle}>{d.description}</div>
                <div style={S.denialSub}>{d.carcLabel}</div>
              </div>
            </div>
            <div style={S.denialRight}>
              <div style={S.denialAmt}>{fmt(d.denied)}</div>
              {d.strength && d.confidence != null && (
                <div style={{ ...S.badge, background: STRENGTH_COLOR[d.strength] + '18', color: STRENGTH_COLOR[d.strength] }}>
                  {STRENGTH_LABEL[d.strength]} · {d.confidence}%
                </div>
              )}
              <div style={{ ...S.chev, transform: expanded === d.id ? 'rotate(180deg)' : 'none' }}>▾</div>
            </div>
          </div>

          {expanded === d.id && (
            <div style={S.body} onClick={e => e.stopPropagation()}>
              <div style={S.codesRow}>
                {[
                  { l: 'CPT Code',      v: d.cpt,   desc: d.description },
                  { l: 'ICD-10',        v: d.icd10, desc: d.icd10Label },
                  { l: 'Denial Code',   v: d.carc ?? '', desc: d.carcLabel ?? '', red: true },
                ].map(({ l, v, desc, red }) => (
                  <div key={l} style={S.codeBlock}>
                    <div style={S.codeL}>{l}</div>
                    <div style={{ ...S.codeV, color: red ? 'oklch(0.55 0.18 22)' : 'oklch(0.25 0.15 268)' }}>{v}</div>
                    <div style={S.codeDesc}>{desc}</div>
                  </div>
                ))}
              </div>

              {d.ourAnalysis && (
                <div style={S.analysisBox}>
                  <div style={S.analysisHead}>
                    <span>⚖️</span>
                    <span style={S.analysisTitle}>Why you can win this</span>
                    {d.policyRef && <span style={S.policyRef}>{d.policyRef}</span>}
                  </div>
                  <p style={S.analysisText}>{d.ourAnalysis}</p>
                </div>
              )}

              {d.confidence != null && (
                <div style={S.confRow}>
                  <span style={S.confLabel}>Appeal confidence</span>
                  <div style={S.confTrack}>
                    <div style={{ ...S.confBar, width: `${d.confidence}%`, background: STRENGTH_COLOR[d.strength] }} />
                  </div>
                  <span style={{ ...S.confPct, color: STRENGTH_COLOR[d.strength] }}>{d.confidence}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Paid items */}
      {paidItems.map(d => (
        <div key={d.id} style={S.paidCard}>
          <div style={S.denialLeft}>
            <div style={{ ...S.codeTag, background: 'oklch(0.52 0.14 142 / 0.1)', color: 'oklch(0.42 0.14 142)', border: '1px solid oklch(0.52 0.14 142 / 0.2)' }}>PAID</div>
            <div>
              <div style={S.denialTitle}>{d.description} — CPT {d.cpt}</div>
              <div style={S.denialSub}>Paid in full · No action needed</div>
            </div>
          </div>
          <div style={{ ...S.denialAmt, color: 'oklch(0.52 0.14 142)' }}>{fmt(d.paid)}</div>
        </div>
      ))}

      {/* CTA */}
      <div style={S.cta}>
        <div>
          <div style={S.ctaTitle}>Ready to fight back?</div>
          <div style={S.ctaSub}>We&apos;ll write a medically precise, legally grounded appeal letter — and call {claim.insurer} on your behalf.</div>
        </div>
        <button style={S.ctaBtn} onClick={onAppeal}>Generate Appeal Letter →</button>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:          { maxWidth:820, margin:'0 auto', padding:'40px 24px 80px' },
  banner:        { background:'oklch(0.25 0.15 268)', borderRadius:20, padding:'32px 36px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, gap:24, flexWrap:'wrap' },
  bannerEye:     { fontSize:12, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'oklch(0.75 0.05 268)', marginBottom:8 },
  bannerHeadline:{ fontFamily:'"DM Serif Display", Georgia, serif', fontSize:'clamp(28px,5vw,42px)', color:'#fff', fontWeight:400, marginBottom:6 },
  bannerAmt:     { color:'oklch(0.85 0.18 55)' },
  bannerSub:     { fontSize:15, color:'oklch(0.75 0.05 268)' },
  bannerRight:   { display:'flex', gap:0, background:'oklch(1 0 0 / 0.07)', borderRadius:14, overflow:'hidden' },
  miniStat:      { padding:'16px 20px', textAlign:'center' },
  miniN:         { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:20, fontWeight:400 },
  miniL:         { fontSize:11, color:'oklch(0.72 0.05 268)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.06em' },
  metaRow:       { display:'flex', gap:0, background:'#fff', border:'1px solid oklch(0.91 0.02 268)', borderRadius:14, overflow:'hidden', marginBottom:32 },
  metaItem:      { flex:1, padding:'14px 16px', borderRight:'1px solid oklch(0.91 0.02 268)' },
  metaLabel:     { fontSize:11, color:'oklch(0.6 0.05 268)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 },
  metaValue:     { fontSize:13, color:'oklch(0.22 0.05 268)', fontWeight:600 },
  sectionHeader: { marginBottom:16 },
  sectionTitle:  { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:22, fontWeight:400, color:'oklch(0.18 0.02 250)', margin:0 },
  sectionSub:    { fontSize:14, color:'oklch(0.55 0.05 268)', marginTop:4 },
  denialCard:    { background:'#fff', border:'1px solid oklch(0.91 0.02 268)', borderRadius:16, marginBottom:12, cursor:'pointer', transition:'all 0.2s', overflow:'hidden' },
  denialCardOpen:{ border:'1px solid oklch(0.55 0.18 22 / 0.3)', boxShadow:'0 4px 24px oklch(0.55 0.18 22 / 0.08)' },
  denialHead:    { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', gap:16 },
  denialLeft:    { display:'flex', alignItems:'center', gap:14 },
  codeTag:       { fontFamily:'monospace', fontWeight:700, fontSize:13, background:'oklch(0.55 0.18 22 / 0.08)', color:'oklch(0.45 0.18 22)', border:'1px solid oklch(0.55 0.18 22 / 0.2)', borderRadius:8, padding:'6px 10px', whiteSpace:'nowrap', flexShrink:0 },
  denialTitle:   { fontSize:15, fontWeight:600, color:'oklch(0.18 0.02 250)', marginBottom:3 },
  denialSub:     { fontSize:13, color:'oklch(0.55 0.05 268)' },
  denialRight:   { display:'flex', alignItems:'center', gap:12, flexShrink:0 },
  denialAmt:     { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:20, color:'oklch(0.55 0.18 22)', fontWeight:400 },
  badge:         { fontSize:12, fontWeight:600, borderRadius:999, padding:'4px 10px' },
  chev:          { fontSize:18, color:'oklch(0.65 0.05 268)', transition:'transform 0.2s' },
  body:          { borderTop:'1px solid oklch(0.93 0.02 268)', padding:'24px' },
  codesRow:      { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 },
  codeBlock:     { background:'oklch(0.97 0.01 268)', borderRadius:12, padding:'14px 16px' },
  codeL:         { fontSize:11, color:'oklch(0.6 0.05 268)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 },
  codeV:         { fontFamily:'monospace', fontWeight:700, fontSize:16, marginBottom:4 },
  codeDesc:      { fontSize:12, color:'oklch(0.5 0.05 268)', lineHeight:1.4 },
  analysisBox:   { background:'oklch(0.52 0.14 142 / 0.06)', border:'1px solid oklch(0.52 0.14 142 / 0.2)', borderRadius:12, padding:'16px 18px', marginBottom:16 },
  analysisHead:  { display:'flex', alignItems:'center', gap:8, marginBottom:8 },
  analysisTitle: { fontSize:14, fontWeight:700, color:'oklch(0.35 0.12 142)', flex:1 },
  policyRef:     { fontFamily:'monospace', fontSize:11, color:'oklch(0.52 0.14 142)', background:'oklch(0.52 0.14 142 / 0.1)', borderRadius:6, padding:'2px 8px' },
  analysisText:  { fontSize:13, color:'oklch(0.35 0.05 268)', lineHeight:1.65, margin:0 },
  confRow:       { display:'flex', alignItems:'center', gap:12 },
  confLabel:     { fontSize:12, color:'oklch(0.55 0.05 268)', whiteSpace:'nowrap' },
  confTrack:     { flex:1, height:6, background:'oklch(0.91 0.02 268)', borderRadius:999, overflow:'hidden' },
  confBar:       { height:'100%', borderRadius:999, transition:'width 1s ease' },
  confPct:       { fontSize:13, fontWeight:700, whiteSpace:'nowrap' },
  paidCard:      { background:'#fff', border:'1px solid oklch(0.91 0.02 268)', borderRadius:16, padding:'18px 24px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' },
  cta:           { marginTop:16, background:'oklch(0.25 0.15 268)', borderRadius:20, padding:'28px 32px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:24, flexWrap:'wrap' },
  ctaTitle:      { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:22, color:'#fff', fontWeight:400, marginBottom:6 },
  ctaSub:        { fontSize:14, color:'oklch(0.75 0.05 268)', lineHeight:1.5, maxWidth:440 },
  ctaBtn:        { background:'oklch(0.85 0.18 55)', color:'oklch(0.15 0.08 55)', border:'none', borderRadius:12, padding:'14px 28px', fontSize:15, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' },
};
