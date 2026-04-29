'use client';

import { useState } from 'react';
import type { AppStep, ClaimResult, AppealLetter, AnalyzeClaimResponse } from '@/lib/types/claim';

// ── Demo data injected for the sample flow ───────────────────────────────────
const SAMPLE_CLAIM: ClaimResult = {
  patient:       'Sarah Mitchell',
  memberId:      'BCBS-2024-9842',
  insurer:       'Blue Cross Blue Shield',
  claimNumber:   'CLM-2024-77291',
  dateOfService: 'Sep 12, 2024',
  provider:      'Valley Surgical Center',
  totalBilled:   12847_00,
  totalAllowed:   9003_00,
  totalPaid:      9000_00,
  totalDenied:    3847_00,
  denials: [
    {
      id:          'd1',
      cpt:         '47562',
      description: 'Laparoscopic cholecystectomy',
      icd10:       'K80.20',
      icd10Label:  'Calculus of gallbladder without cholecystitis',
      billed:      8200_00,
      paid:        5800_00,
      denied:      2400_00,
      carc:        'CO-97',
      carcLabel:   'Bundled/included in payment for another service',
      ourAnalysis: 'BCBS applied CO-97 claiming the cholecystectomy is bundled with the pre-op visit (CPT 99213). This is incorrect — NCCI edits explicitly allow separate billing when the pre-op evaluation occurs more than 24 hours before surgery. Date gap confirmed: 3 days.',
      policyRef:   'NCCI Policy Manual Ch. 1, §D.6',
      confidence:  87,
      strength:    'strong',
    },
    {
      id:          'd2',
      cpt:         'Z01.810',
      description: 'Pre-operative EKG examination',
      icd10:       'Z01.810',
      icd10Label:  'Encounter for preprocedural cardiovascular exam',
      billed:      1447_00,
      paid:        0,
      denied:      1447_00,
      carc:        'CO-4',
      carcLabel:   'Service/procedure inconsistent with patient\'s age/sex/diagnosis',
      ourAnalysis: 'Insurer flagged EKG as inconsistent with a 34-year-old patient. AHA guidelines explicitly recommend pre-op EKG for patients with history of cardiac symptoms regardless of age. Medical record shows palpitation notation from 2023.',
      policyRef:   'AHA 2022 Perioperative Guidelines §3.1',
      confidence:  74,
      strength:    'moderate',
    },
    {
      id:          'd3',
      cpt:         '99213',
      description: 'Office/outpatient visit, established patient',
      icd10:       'K80.20',
      icd10Label:  'Calculus of gallbladder without cholecystitis',
      billed:      500_00,
      paid:        500_00,
      denied:      0,
      carc:        null,
      carcLabel:   null,
      ourAnalysis: null,
      policyRef:   null,
      confidence:  null,
      strength:    'paid',
    },
  ],
};

const SAMPLE_APPEAL: AppealLetter = {
  claimId:   'CLM-2024-77291',
  winRate:   82,
  grounds:   2,
  citations: ['NCCI Policy Manual Ch. 1 §D.6', 'AHA 2022 Perioperative Guidelines §3.1', '45 CFR §147.136', 'CMS-1500 Claim Form Instructions Rev. 2023'],
  content: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAL APPEAL — INSURANCE CLAIM DENIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date:    ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}
RE:      Claim #CLM-2024-77291 — Denial Appeal
Member:  Sarah Mitchell · BCBS-2024-9842

Dear Blue Cross Blue Shield Appeals Department,

I am writing to formally appeal the denial of claim #CLM-2024-77291
for services rendered on September 12, 2024 at Valley Surgical Center.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GROUND 1: CO-97 BUNDLING DENIAL IS INCORRECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BCBS applied adjustment code CO-97, claiming CPT 47562
(laparoscopic cholecystectomy, $2,400.00) is bundled with the
pre-operative visit (CPT 99213, billed separately on Sep 9).

This is incorrect. Per NCCI Policy Manual Chapter 1, Section D.6,
separate billing is explicitly permitted when the pre-operative
evaluation occurs more than 24 hours before the surgical procedure.
The pre-op visit was conducted 3 days prior (Sep 9 vs Sep 12).

Request: Reprocess CPT 47562 at allowed rate. Expected: $2,400.00.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GROUND 2: CO-4 DENIAL OF PRE-OP EKG IS INCORRECT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BCBS denied CPT Z01.810 (pre-operative EKG, $1,447.00) citing CO-4,
claiming the service is inconsistent with the patient's age/diagnosis.

AHA 2022 Perioperative Cardiovascular Evaluation Guidelines (§3.1)
explicitly recommend pre-operative EKG for patients with a documented
history of cardiac symptoms, regardless of age. Ms. Mitchell's chart
notes palpitation complaints recorded in October 2023.

The denial therefore lacks clinical basis and conflicts with accepted
national practice standards.

Request: Reprocess Z01.810 at allowed rate. Expected: $1,447.00.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL AMOUNT IN DISPUTE: $3,847.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Under 45 CFR §147.136, I request a response within 60 days.
Please confirm receipt of this appeal and provide a case reference number.

Sincerely,
Sarah Mitchell
Member ID: BCBS-2024-9842`,
};

// ── Transform old AnalyzeClaimResponse → new ClaimResult ─────────────────────
function mapApiResponse(data: AnalyzeClaimResponse): ClaimResult {
  const c = data.claim;
  return {
    patient:       c.patientName   ?? 'Patient',
    memberId:      c.memberId      ?? '—',
    insurer:       c.insurerName   ?? 'Insurer',
    claimNumber:   c.claimId       ?? '—',
    dateOfService: c.serviceDate   ?? '—',
    provider:      c.providerName  ?? '—',
    totalBilled:   c.totals.billed,
    totalAllowed:  c.totals.billed - c.totals.potentialSavings,
    totalPaid:     c.totals.insurancePaid,
    totalDenied:   c.totals.potentialSavings,
    denials: c.lines
      .filter(l => l.denial)
      .map((l, i) => ({
        id:          l.id,
        cpt:         l.cpt?.code     ?? `Line ${i + 1}`,
        description: l.cpt?.description ?? 'Service',
        icd10:       l.diagnosis?.[0]?.code  ?? '—',
        icd10Label:  l.diagnosis?.[0]?.description ?? '—',
        billed:      l.billed,
        paid:        l.insurancePaid,
        denied:      l.billed - l.insurancePaid,
        carc:        l.denial?.carc.code   ?? null,
        carcLabel:   l.denial?.carc.description ?? null,
        ourAnalysis: l.denial?.reason ?? null,
        policyRef:   null,
        confidence:  l.denial?.successRate != null ? Math.round(l.denial.successRate * 100) : null,
        strength:    (l.denial?.appealable ? 'strong' : 'weak') as 'strong' | 'weak',
      })),
  };
}
import { UploadStep }  from '@/components/claim/UploadStep';
import { AnalyzeStep } from '@/components/claim/AnalyzeStep';
import { ResultsStep } from '@/components/claim/ResultsStep';
import { AppealStep }  from '@/components/claim/AppealStep';
import { CallStep }    from '@/components/claim/CallStep';

const NAV_STEPS = [
  { id: 'results', label: 'Results'      },
  { id: 'appeal',  label: 'Appeal Letter' },
  { id: 'call',    label: 'Call Insurer'  },
] as const;

function NavStepper({ step, setStep }: { step: AppStep; setStep: (s: AppStep) => void }) {
  const idx = NAV_STEPS.findIndex(s => s.id === step);
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, flex:1 }}>
      {NAV_STEPS.map((s, i) => {
        const done   = i < idx;
        const active = s.id === step;
        return (
          <div key={s.id} style={{ display:'flex', alignItems:'center', gap:6 }}>
            {i > 0 && (
              <div style={{ width:44, height:2, borderRadius:999, background: done ? 'oklch(0.25 0.15 268)' : 'oklch(0.87 0.02 268)', transition:'background 0.3s' }} />
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
            <span style={{ fontSize:13, whiteSpace:'nowrap', color: active ? 'oklch(0.25 0.15 268)' : done ? 'oklch(0.5 0.05 268)' : 'oklch(0.70 0.03 268)', fontWeight: active ? 600 : 400, transition:'all 0.2s' }}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [step,      setStep]      = useState<AppStep>('upload');
  const [fileName,  setFileName]  = useState<string>('EOB_document.pdf');
  const [claim,     setClaim]     = useState<ClaimResult | null>(null);
  const [appeal,    setAppeal]    = useState<AppealLetter | null>(null);
  const [callId,    setCallId]    = useState<string | null>(null);
  const [isSample,  setIsSample]  = useState(false);

  const showNav = !['upload', 'analyze'].includes(step);

  const handleUpload = async (file: File | 'sample') => {
    if (file === 'sample') {
      setIsSample(true);
    } else {
      setIsSample(false);
      setFileName(file.name);
    }
    setStep('analyze');
  };

  const handleAnalyzeDone = async () => {
    if (isSample) {
      setClaim(SAMPLE_CLAIM);
      setStep('results');
      return;
    }
    try {
      const body = new FormData();
      body.append('action', 'decode');
      const res  = await fetch('/api/analyze-claim', { method: 'POST', body });
      const raw  = await res.json() as AnalyzeClaimResponse;
      setClaim(mapApiResponse(raw));
    } catch (err) {
      console.error('analyze-claim failed', err);
    }
    setStep('results');
  };

  const handleAppeal = async () => {
    if (!claim) return;
    setStep('appeal');
    if (isSample) {
      setAppeal(SAMPLE_APPEAL);
      return;
    }
    try {
      const res  = await fetch('/api/analyze-claim', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'appeal', claimNumber: claim.claimNumber }),
      });
      const data = await res.json() as AppealLetter;
      setAppeal(data);
    } catch (err) {
      console.error('appeal generation failed', err);
    }
  };

  const handleCall = async () => {
    setStep('call');
    try {
      const res  = await fetch('/api/initiate-call', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ claimNumber: claim?.claimNumber }),
      });
      const data = await res.json() as { callId: string };
      setCallId(data.callId);
    } catch (err) {
      console.error('initiate-call failed', err);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#F8F7F4', fontFamily:"'DM Sans', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{ background:'#F8F7F4', borderBottom:'1px solid oklch(0.90 0.02 268 / 0.7)', position:'sticky', top:0, zIndex:100, backdropFilter:'blur(12px)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px', height:58, display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', flexShrink:0 }} onClick={() => setStep('upload')}>
            <div style={{ width:32, height:32, borderRadius:8, background:'oklch(0.25 0.15 268)', color:'#fff', fontWeight:800, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>TC</div>
            <span style={{ fontFamily:'"DM Serif Display",Georgia,serif', fontSize:18, color:'oklch(0.18 0.02 250)' }}>TrueConsent</span>
            <span style={{ fontSize:10, fontWeight:600, background:'oklch(0.35 0.15 268 / 0.1)', color:'oklch(0.35 0.15 268)', borderRadius:999, padding:'2px 7px' }}>beta</span>
          </div>

          {showNav && claim && <NavStepper step={step} setStep={setStep} />}

          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
            {showNav && (
              <button style={{ fontSize:13, color:'oklch(0.55 0.05 268)', background:'none', border:'none', cursor:'pointer' }} onClick={() => setStep('upload')}>
                ← New claim
              </button>
            )}
            <div style={{ display:'flex', alignItems:'center', fontSize:12, fontWeight:600, borderRadius:999, padding:'5px 12px', background: step==='call' ? 'oklch(0.52 0.14 142 / 0.1)' : 'oklch(0.35 0.15 268 / 0.08)', color: step==='call' ? 'oklch(0.42 0.12 142)' : 'oklch(0.35 0.15 268)' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block', marginRight:6, opacity:0.8 }} />
              {step === 'call' ? 'Call live' : 'Demo mode'}
            </div>
          </div>
        </div>
      </nav>

      {/* Steps */}
      <main style={{ flex:1 }}>
        {step === 'upload'  && <UploadStep  onUpload={handleUpload} />}
        {step === 'analyze' && <AnalyzeStep fileName={fileName} onDone={handleAnalyzeDone} />}
        {step === 'results' && claim && <ResultsStep claim={claim} onAppeal={handleAppeal} />}
        {step === 'appeal'  && appeal && claim && (
          <AppealStep appeal={appeal} insurerName={claim.insurer} onCall={handleCall} />
        )}
        {step === 'call' && callId && claim && (
          <CallStep
            callId={callId}
            insurerName={claim.insurer}
            insurerPhone="(800) 267-0989"
            claimNumber={claim.claimNumber}
            patientName={claim.patient}
            appealAmount={claim.totalDenied}
          />
        )}
      </main>

      {step === 'upload' && (
        <footer style={{ textAlign:'center', padding:'24px', fontSize:13, color:'oklch(0.65 0.03 268)', display:'flex', justifyContent:'center', gap:10 }}>
          <span>© 2026 TrueConsent, Inc.</span>
          <span>·</span><span>HIPAA Compliant</span>
          <span>·</span><span>Not legal advice</span>
        </footer>
      )}
    </div>
  );
}
