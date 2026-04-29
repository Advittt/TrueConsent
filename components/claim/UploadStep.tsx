'use client';
// components/claim/UploadStep.tsx

import { useRef, useState } from 'react';

interface Props {
  onUpload: (file: File | 'sample') => void;
}

export function UploadStep({ onUpload }: Props) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { setFileName(file.name); setTimeout(() => onUpload(file), 600); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setFileName(file.name); setTimeout(() => onUpload(file), 600); }
  };

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

        <div
          style={{ ...S.dropzone, ...(dragging ? S.dropzoneDragging : {}) }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.eob,.txt"
            style={{ display: 'none' }}
            onChange={handleChange}
          />
          {fileName ? (
            <div style={S.fileReady}>
              <div style={S.fileIcon}>✓</div>
              <div style={S.fileName}>{fileName}</div>
              <div style={S.fileStatus}>Uploading…</div>
            </div>
          ) : (
            <>
              <UploadIcon />
              <div style={S.dropText}>Drop your EOB here</div>
              <div style={S.dropSub}>PDF, image, or text file · HIPAA-compliant</div>
              <div style={S.browseBtn}>Browse files</div>
            </>
          )}
        </div>

        <div style={S.orDivider}>
          <span style={S.orLine} />
          <span style={S.orText}>or</span>
          <span style={S.orLine} />
        </div>

        <button style={S.sampleBtn} onClick={() => onUpload('sample')}>
          <span>Try with Sarah&apos;s sample EOB</span>
          <span style={S.sampleBtnSub}>— Denied $3,847 by BCBS. She fought back.</span>
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

      <div style={S.statsRow}>
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

function UploadIcon() {
  return (
    <div style={{ color: 'oklch(0.55 0.15 268)', marginBottom: 8 }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M20 6L20 26M20 6L14 12M20 6L26 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 30H32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:            { display:'flex', flexDirection:'column', alignItems:'center', padding:'0 24px 64px', maxWidth:720, margin:'0 auto' },
  hero:            { width:'100%', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', paddingTop:72 },
  badge:           { display:'inline-block', background:'oklch(0.25 0.15 268 / 0.08)', color:'oklch(0.35 0.15 268)', border:'1px solid oklch(0.35 0.15 268 / 0.2)', borderRadius:999, padding:'6px 16px', fontSize:12, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:24 },
  headline:        { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:'clamp(36px, 6vw, 58px)', fontWeight:400, lineHeight:1.15, color:'oklch(0.18 0.02 250)', margin:'0 0 20px', letterSpacing:'-0.02em' },
  accent:          { color:'oklch(0.55 0.18 22)' },
  sub:             { fontSize:18, color:'oklch(0.45 0.02 250)', lineHeight:1.7, maxWidth:520, margin:'0 0 40px' },
  dropzone:        { width:'100%', border:'2px dashed oklch(0.75 0.05 268)', borderRadius:20, padding:'48px 32px', cursor:'pointer', transition:'all 0.2s', background:'oklch(0.99 0.005 268)', display:'flex', flexDirection:'column', alignItems:'center', gap:12 },
  dropzoneDragging:{ border:'2px dashed oklch(0.55 0.15 268)', background:'oklch(0.96 0.02 268)', transform:'scale(1.01)' },
  dropText:        { fontSize:18, fontWeight:600, color:'oklch(0.25 0.05 268)' },
  dropSub:         { fontSize:14, color:'oklch(0.55 0.05 268)' },
  browseBtn:       { marginTop:8, background:'oklch(0.25 0.15 268)', color:'#fff', borderRadius:10, padding:'10px 24px', fontSize:14, fontWeight:600 },
  fileReady:       { display:'flex', flexDirection:'column', alignItems:'center', gap:8 },
  fileIcon:        { width:56, height:56, borderRadius:'50%', background:'oklch(0.52 0.14 142)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 },
  fileName:        { fontSize:16, fontWeight:600, color:'oklch(0.25 0.05 268)' },
  fileStatus:      { fontSize:14, color:'oklch(0.52 0.14 142)' },
  orDivider:       { display:'flex', alignItems:'center', gap:16, width:'100%', margin:'28px 0 20px' },
  orLine:          { flex:1, height:1, background:'oklch(0.88 0.02 268)' },
  orText:          { fontSize:13, color:'oklch(0.6 0.02 268)', fontWeight:500 },
  sampleBtn:       { background:'none', border:'2px solid oklch(0.80 0.05 268)', borderRadius:14, padding:'16px 28px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'all 0.15s', width:'100%' },
  sampleBtnSub:    { fontSize:13, color:'oklch(0.55 0.05 268)' },
  trustRow:        { display:'flex', gap:24, marginTop:24, flexWrap:'wrap', justifyContent:'center' },
  trustItem:       { display:'flex', alignItems:'center', gap:6, fontSize:13, color:'oklch(0.55 0.05 268)' },
  trustDot:        { width:6, height:6, borderRadius:'50%', background:'oklch(0.52 0.14 142)', display:'inline-block' },
  statsRow:        { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, width:'100%', marginTop:64 },
  statCard:        { background:'#fff', borderRadius:16, padding:'20px 16px', textAlign:'center', border:'1px solid oklch(0.91 0.02 268)' },
  statNum:         { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:28, fontWeight:400, color:'oklch(0.25 0.15 268)', marginBottom:4 },
  statLabel:       { fontSize:13, color:'oklch(0.55 0.05 268)', lineHeight:1.4 },
};
