'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AppStep, ClaimResult, AppealLetter } from '@/lib/types/claim';
import {
  SAMPLE_CLAIM,
  buildSampleAppeal,
  DEMO_TRANSCRIPT,
  DEMO_INSURER_PHONE,
  DEMO_CALL_DURATION_MS,
  DEMO_CALL_REFERENCE,
} from '@/lib/demo-data';
import { UploadStep }  from '@/components/claim/UploadStep';
import { AnalyzeStep } from '@/components/claim/AnalyzeStep';
import { ResultsStep } from '@/components/claim/ResultsStep';
import { AppealStep }  from '@/components/claim/AppealStep';
import { CallStep }    from '@/components/claim/CallStep';
import { useNarrow }   from '@/lib/use-narrow';

const NAV_STEPS = [
  { id: 'results', label: 'Results'      },
  { id: 'appeal',  label: 'Appeal Letter' },
  { id: 'call',    label: 'Call Insurer'  },
] as const;

function NavStepper({ step, setStep, narrow }: { step: AppStep; setStep: (s: AppStep) => void; narrow: boolean }) {
  const idx = NAV_STEPS.findIndex(s => s.id === step);
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, flex:1, minWidth:0 }}>
      {NAV_STEPS.map((s, i) => {
        const done   = i < idx;
        const active = s.id === step;
        return (
          <div key={s.id} style={{ display:'flex', alignItems:'center', gap:6 }}>
            {i > 0 && (
              <div style={{ width: narrow ? 20 : 44, height:2, borderRadius:999, background: done ? 'oklch(0.25 0.15 268)' : 'oklch(0.87 0.02 268)', transition:'background 0.3s' }} />
            )}
            <div
              style={{ width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', background: active||done ? 'oklch(0.25 0.15 268)' : '#fff', border:`2px solid ${active||done ? 'oklch(0.25 0.15 268)' : 'oklch(0.82 0.03 268)'}`, boxShadow: active ? '0 0 0 3px oklch(0.25 0.15 268 / 0.15)' : 'none', cursor: done||active ? 'pointer' : 'default' }}
              onClick={() => (done || active) && setStep(s.id as AppStep)}
            >
              {done
                ? <span style={{ color:'#fff', fontSize:10, fontWeight:700 }}>✓</span>
                : <span style={{ color: active ? '#fff' : 'oklch(0.65 0.05 268)', fontSize:10, fontWeight:700 }}>{i+1}</span>
              }
            </div>
            {!narrow && (
              <span style={{ fontSize:13, whiteSpace:'nowrap', color: active ? 'oklch(0.25 0.15 268)' : done ? 'oklch(0.5 0.05 268)' : 'oklch(0.70 0.03 268)', fontWeight: active ? 600 : 400, transition:'all 0.2s' }}>
                {s.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [step,   setStep]   = useState<AppStep>('upload');
  const [claim,  setClaim]  = useState<ClaimResult | null>(null);
  const [appeal, setAppeal] = useState<AppealLetter | null>(null);
  const narrow              = useNarrow(720);

  const showNav = !['upload', 'analyze'].includes(step);

  const handleStart        = () => { setClaim(null); setAppeal(null); setStep('analyze'); };
  const handleAnalyzeDone  = () => { setClaim(SAMPLE_CLAIM); setStep('results'); };
  const handleAppeal       = () => { setAppeal(buildSampleAppeal()); setStep('appeal'); };
  const handleCall         = () => { setStep('call'); };

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#F8F7F4', fontFamily:"'DM Sans', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{ background:'#F8F7F4', borderBottom:'1px solid oklch(0.90 0.02 268 / 0.7)', position:'sticky', top:0, zIndex:100, backdropFilter:'blur(12px)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 16px', height:58, display:'flex', alignItems:'center', gap: narrow ? 10 : 20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', flexShrink:0 }} onClick={() => setStep('upload')}>
            <div style={{ width:32, height:32, borderRadius:8, background:'oklch(0.25 0.15 268)', color:'#fff', fontWeight:800, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>TC</div>
            {!narrow && <span style={{ fontFamily:'"DM Serif Display",Georgia,serif', fontSize:18, color:'oklch(0.18 0.02 250)' }}>TrueConsent</span>}
            {!narrow && <span style={{ fontSize:10, fontWeight:600, background:'oklch(0.35 0.15 268 / 0.1)', color:'oklch(0.35 0.15 268)', borderRadius:999, padding:'2px 7px' }}>beta</span>}
          </div>

          {showNav && claim && <NavStepper step={step} setStep={setStep} narrow={narrow} />}

          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap: narrow ? 6 : 10 }}>
            {showNav && (
              <button style={{ fontSize:13, color:'oklch(0.55 0.05 268)', background:'none', border:'none', cursor:'pointer', padding: narrow ? '4px 6px' : '4px 8px' }} onClick={() => setStep('upload')}>
                {narrow ? '←' : '← New claim'}
              </button>
            )}
            {!narrow && (
              <div style={{ display:'flex', alignItems:'center', fontSize:12, fontWeight:600, borderRadius:999, padding:'5px 12px', background: step==='call' ? 'oklch(0.52 0.14 142 / 0.1)' : 'oklch(0.35 0.15 268 / 0.08)', color: step==='call' ? 'oklch(0.42 0.12 142)' : 'oklch(0.35 0.15 268)' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block', marginRight:6, opacity:0.8 }} />
                {step === 'call' ? 'Call live' : 'Demo mode'}
              </div>
            )}
            <Link
              href="/about"
              style={{ fontSize:13, fontWeight:600, color:'oklch(0.4 0.05 268)', textDecoration:'none', padding: narrow ? '6px 6px' : '8px 10px', whiteSpace:'nowrap', transition:'color 0.15s' }}
            >
              About
            </Link>
            <Link
              href="/waitlist"
              style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#fff', background:'oklch(0.25 0.15 268)', textDecoration:'none', borderRadius:999, padding: narrow ? '7px 12px' : '8px 16px', letterSpacing:'-0.005em', boxShadow:'0 4px 12px oklch(0.25 0.15 268 / 0.18)', transition:'all 0.15s' }}
            >
              {narrow ? 'Join →' : 'Join waitlist  →'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Steps */}
      <main style={{ flex:1 }}>
        {step === 'upload'  && <UploadStep  onStart={handleStart} />}
        {step === 'analyze' && <AnalyzeStep onDone={handleAnalyzeDone} />}
        {step === 'results' && claim && <ResultsStep claim={claim} onAppeal={handleAppeal} />}
        {step === 'appeal'  && appeal && claim && (
          <AppealStep appeal={appeal} insurerName={claim.insurer} onCall={handleCall} />
        )}
        {step === 'call' && claim && (
          <CallStep
            claim={claim}
            insurerPhone={DEMO_INSURER_PHONE}
            transcript={DEMO_TRANSCRIPT}
            durationMs={DEMO_CALL_DURATION_MS}
            referenceNumber={DEMO_CALL_REFERENCE}
          />
        )}
      </main>

      {step === 'upload' && (
        <footer style={{ textAlign:'center', padding:'24px', fontSize:13, color:'oklch(0.65 0.03 268)', display:'flex', justifyContent:'center', gap:10 }}>
          <span>© 2026 TrueConsent, Inc.</span>
          <span>·</span><span>Demo · sample data only</span>
          <span>·</span><span>Not legal advice</span>
        </footer>
      )}
    </div>
  );
}
