import type { ClaimResult, AppealLetter, TranscriptLine } from '@/lib/types/claim';

export const SAMPLE_CLAIM: ClaimResult = {
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

export const SAMPLE_APPEAL: AppealLetter = {
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

export const DEMO_CALL_DURATION_MS = 25_000;
export const DEMO_CALL_REFERENCE   = 'AP-2847';

export const DEMO_TRANSCRIPT: TranscriptLine[] = [
  { t: 0,  speaker: 'system', text: 'Dialing Blue Cross Blue Shield appeals line…' },
  { t: 1,  speaker: 'system', text: 'Connected to automated phone system.' },
  { t: 2,  speaker: 'ai',     text: "Navigating IVR — selecting 'appeals'." },
  { t: 2,  speaker: 'system', text: 'Transferred to claims department. On hold.' },
  { t: 3,  speaker: 'system', text: 'Representative connected.' },
  { t: 4,  speaker: 'bcbs',   text: 'Thank you for calling Blue Cross Blue Shield. This is Jennifer, how can I help you?' },
  { t: 6,  speaker: 'ai',     text: "Hi Jennifer, I'm calling on behalf of Sarah Mitchell, Member ID BCBS-2024-9842. I have a signed representative authorization on file. I'm filing a Level 1 internal appeal for claim number CLM-2024-77291." },
  { t: 10, speaker: 'bcbs',   text: 'Let me pull that up… okay, I see the claim from September 12, 2024. What are you appealing?' },
  { t: 12, speaker: 'ai',     text: 'Two items. First, the CO-97 bundling denial on CPT 47562 — laparoscopic cholecystectomy, $2,400 denied. Per NCCI Policy Manual Chapter 1 Section D.6, separate billing is permitted when the pre-op visit occurs more than 24 hours before surgery. The pre-op was September 9th, surgery was September 12th — three days apart.' },
  { t: 17, speaker: 'bcbs',   text: 'I see. And the second?' },
  { t: 18, speaker: 'ai',     text: 'The CO-4 denial on Z01.810 — pre-op EKG, $1,447 denied. AHA 2022 Perioperative Guidelines Section 3.1 explicitly recommend pre-op EKG for patients with documented cardiac symptoms. Ms. Mitchell has a palpitation history from October 2023.' },
  { t: 21, speaker: 'bcbs',   text: "Understood. I'm initiating a Level 1 appeal on both items. Written confirmation will arrive within five business days." },
  { t: 23, speaker: 'ai',     text: 'Can I get a reference number for the appeal?' },
  { t: 24, speaker: 'bcbs',   text: 'Your reference is AP-2847. Resolution timeframe is 30 days from today.' },
  { t: 25, speaker: 'system', text: 'Call ended. Duration: 25s. $3,847 in dispute.' },
];
