'use client';
// components/claim/CallStep.tsx

import { useEffect, useRef, useState } from 'react';
import type { CallState, TranscriptLine } from '@/lib/types/claim';

interface Props {
  callId: string;
  insurerName: string;
  insurerPhone: string;
  claimNumber: string;
  patientName: string;
  appealAmount: number;
  pollInterval?: number;
}

const fmt = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtTime = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function CallStep({
  callId,
  insurerName,
  insurerPhone,
  claimNumber,
  patientName,
  appealAmount,
  pollInterval = 2000,
}: Props) {
  const [call, setCall]     = useState<CallState>({
    callId,
    status: 'initiating',
    durationMs: 0,
    transcript: [],
  });
  const [wonBadge, setWon]  = useState(false);
  const transcriptRef       = useRef<HTMLDivElement>(null);
  const tickRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/call-status?callId=${callId}`);
        if (!res.ok) return;
        const raw = await res.json();
        // API returns `transcripts` with `role` field; normalize to `transcript` with `speaker`
        const rawLines = raw.transcript ?? raw.transcripts ?? [];
        const data: CallState = {
          callId:          raw.callId ?? callId,
          status:          raw.status ?? 'dialing',
          durationMs:      raw.durationMs ?? 0,
          transcript:      rawLines.map((l: { role?: string; speaker?: string; text?: string; t?: number }) => ({
            t:       l.t ?? 0,
            speaker: l.speaker ?? (l.role === 'agent' ? 'ai' : l.role === 'rep' ? 'Rep' : 'system'),
            text:    l.text ?? '',
          })),
          referenceNumber: raw.referenceNumber,
        };
        setCall(data);
        if (data.status === 'complete' || data.status === 'failed') {
          if (tickRef.current) clearInterval(tickRef.current);
          if (data.status === 'complete') setTimeout(() => setWon(true), 600);
        }
      } catch {
        // network error — keep polling
      }
    };

    poll();
    tickRef.current = setInterval(poll, pollInterval);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [callId, pollInterval]);

  useEffect(() => {
    if (transcriptRef.current)
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [call.transcript]);

  const callDone = call.status === 'complete' || call.status === 'failed';
  const progress = Math.min(call.durationMs / 54000, 1);

  return (
    <div style={S.page}>
      <div style={S.layout}>

        {/* Phone card */}
        <div style={S.phone}>
          <div style={S.phoneTop}>
            <div style={S.caller}>
              <div style={S.avatar}>{insurerName.slice(0, 4).toUpperCase()}</div>
              <div>
                <div style={S.callerName}>{insurerName}</div>
                <div style={S.callerSub}>Provider Relations · {insurerPhone}</div>
              </div>
            </div>
            <div style={{ ...S.badge, ...(callDone ? S.badgeDone : S.badgeLive) }}>
              {callDone ? '✓ Call complete' : <><span style={S.liveDot} />Live</>}
            </div>
          </div>

          <div style={S.timerWrap}>
            <div style={S.timer}>{fmtTime(call.durationMs)}</div>
            <div style={S.timerLabel}>{callDone ? 'Total duration' : 'Elapsed'}</div>
          </div>

          <div style={S.track}>
            <div style={{ ...S.bar, width: `${progress * 100}%` }} />
          </div>

          {!callDone && <WaveForm durationMs={call.durationMs} />}

          <div style={S.refGrid}>
            <div style={S.refItem}>
              <div style={S.refL}>Claim</div>
              <div style={S.refV}>{claimNumber}</div>
            </div>
            <div style={S.refItem}>
              <div style={S.refL}>Member</div>
              <div style={S.refV}>{patientName}</div>
            </div>
            {call.referenceNumber && (
              <div style={S.refItem}>
                <div style={S.refL}>Call Ref</div>
                <div style={{ ...S.refV, color: 'oklch(0.52 0.14 142)' }}>{call.referenceNumber}</div>
              </div>
            )}
          </div>
        </div>

        {/* Transcript */}
        <div style={S.tPanel}>
          <div style={S.tHeader}>
            <span style={S.tTitle}>Live Transcript</span>
            <span style={S.tSub}>AI-generated · Real-time</span>
          </div>
          <div style={S.tBody} ref={transcriptRef}>
            {call.transcript.map((line, i) => (
              <TranscriptItem key={i} line={line} />
            ))}
            {!callDone && call.transcript.length > 0 && (
              <div style={S.typing}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ ...S.typDot, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Win banner */}
      {wonBadge && (
        <div style={S.win}>
          <div style={S.winLeft}>
            <div style={S.winEmoji}>🎉</div>
            <div>
              <div style={S.winTitle}>Appeal filed successfully</div>
              <div style={S.winSub}>
                Reference {call.referenceNumber} · {insurerName} must respond within 30 days · Amount: {fmt(appealAmount)}
              </div>
            </div>
          </div>
          <div style={S.winStats}>
            {[
              { n: '30 days', l: 'response window' },
              { n: fmt(appealAmount), l: 'at stake' },
              { n: '91%', l: 'win rate' },
            ].map(({ n, l }) => (
              <div key={l} style={S.winStat}>
                <div style={S.winStatN}>{n}</div>
                <div style={S.winStatL}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TranscriptItem({ line }: { line: TranscriptLine }) {
  return (
    <div style={{
      ...S.line,
      ...(line.speaker === 'bcbs' ? { alignItems: 'flex-end' } :
          line.speaker === 'system' ? { alignItems: 'center' } : {}),
      animation: 'fadeSlideUp 0.3s ease',
    }}>
      {line.speaker !== 'system' && (
        <div style={{ ...S.spkLabel, color: line.speaker === 'ai' ? 'oklch(0.55 0.15 268)' : 'oklch(0.55 0.05 268)' }}>
          {line.speaker === 'ai' ? '🤖 TrueConsent AI' : `👤 ${line.speaker.toUpperCase()}`}
        </div>
      )}
      <div style={S.bubble}>{line.text}</div>
    </div>
  );
}

function WaveForm({ durationMs }: { durationMs: number }) {
  return (
    <div style={S.wave}>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} style={{
          ...S.waveBar,
          height: `${10 + Math.sin(durationMs / 200 + i * 0.7) * 14 + 14}px`,
        }} />
      ))}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:      { maxWidth:980, margin:'0 auto', padding:'40px 24px 80px' },
  layout:    { display:'grid', gridTemplateColumns:'320px 1fr', gap:24, alignItems:'start' },
  phone:     { background:'oklch(0.14 0.08 268)', borderRadius:24, padding:'28px 24px', color:'#fff' },
  phoneTop:  { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 },
  caller:    { display:'flex', alignItems:'center', gap:12 },
  avatar:    { width:44, height:44, borderRadius:12, background:'oklch(0.35 0.12 220)', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' },
  callerName:{ fontSize:15, fontWeight:700, marginBottom:3 },
  callerSub: { fontSize:12, color:'oklch(0.65 0.05 268)' },
  badge:     { borderRadius:999, padding:'5px 12px', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:6 },
  badgeLive: { background:'oklch(0.52 0.14 142 / 0.2)', color:'oklch(0.75 0.14 142)' },
  badgeDone: { background:'oklch(0.52 0.14 142 / 0.15)', color:'oklch(0.72 0.14 142)' },
  liveDot:   { width:8, height:8, borderRadius:'50%', background:'oklch(0.72 0.14 142)', animation:'pulse 1s ease-in-out infinite', display:'inline-block' },
  timerWrap: { textAlign:'center', marginBottom:16 },
  timer:     { fontFamily:'"DM Serif Display",Georgia,serif', fontSize:48, fontWeight:400, color:'#fff', letterSpacing:'-0.02em' },
  timerLabel:{ fontSize:12, color:'oklch(0.65 0.05 268)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:4 },
  track:     { height:4, background:'oklch(1 0 0 / 0.1)', borderRadius:999, overflow:'hidden', marginBottom:20 },
  bar:       { height:'100%', background:'linear-gradient(90deg, oklch(0.60 0.15 192), oklch(0.52 0.14 142))', borderRadius:999, transition:'width 0.3s' },
  wave:      { display:'flex', justifyContent:'center', alignItems:'center', gap:3, height:40, marginBottom:16 },
  waveBar:   { width:4, borderRadius:999, background:'oklch(0.60 0.15 192)', transition:'height 0.1s ease' },
  refGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, borderTop:'1px solid oklch(1 0 0 / 0.1)', paddingTop:16 },
  refItem:   {},
  refL:      { fontSize:10, color:'oklch(0.55 0.05 268)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 },
  refV:      { fontSize:12, fontWeight:600, color:'oklch(0.85 0.05 268)' },
  tPanel:    { background:'#fff', border:'1px solid oklch(0.91 0.02 268)', borderRadius:20, overflow:'hidden', display:'flex', flexDirection:'column', minHeight:480 },
  tHeader:   { padding:'16px 24px', borderBottom:'1px solid oklch(0.93 0.02 268)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'oklch(0.98 0.01 268)' },
  tTitle:    { fontSize:14, fontWeight:700, color:'oklch(0.22 0.05 268)' },
  tSub:      { fontSize:12, color:'oklch(0.6 0.05 268)' },
  tBody:     { flex:1, padding:'20px 24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:16 },
  line:      { display:'flex', flexDirection:'column', gap:4 },
  spkLabel:  { fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' },
  bubble:    { fontSize:14, color:'oklch(0.25 0.02 250)', lineHeight:1.55, background:'oklch(0.97 0.01 268)', borderRadius:12, padding:'10px 14px', maxWidth:'85%' },
  typing:    { display:'flex', gap:4, padding:'8px 14px', background:'oklch(0.97 0.01 268)', borderRadius:12, alignSelf:'flex-end', width:'fit-content' },
  typDot:    { width:6, height:6, borderRadius:'50%', background:'oklch(0.65 0.05 268)', display:'inline-block', animation:'bounce 1s ease-in-out infinite' },
  win:       { marginTop:24, background:'oklch(0.52 0.14 142)', borderRadius:20, padding:'24px 28px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:20, flexWrap:'wrap' },
  winLeft:   { display:'flex', alignItems:'center', gap:16 },
  winEmoji:  { fontSize:36 },
  winTitle:  { fontFamily:'"DM Serif Display",Georgia,serif', fontSize:22, color:'#fff', fontWeight:400, marginBottom:4 },
  winSub:    { fontSize:13, color:'oklch(0.85 0.07 142)', lineHeight:1.5 },
  winStats:  { display:'flex', gap:0, background:'oklch(1 0 0 / 0.12)', borderRadius:14, overflow:'hidden' },
  winStat:   { padding:'14px 20px', textAlign:'center', borderRight:'1px solid oklch(1 0 0 / 0.1)' },
  winStatN:  { fontFamily:'"DM Serif Display",Georgia,serif', fontSize:22, color:'#fff' },
  winStatL:  { fontSize:11, color:'oklch(0.85 0.07 142)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:2 },
};
