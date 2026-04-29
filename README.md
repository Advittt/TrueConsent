# TrueConsent

> You leave the hospital. A bill arrives. It's full of codes nobody explained to you. Most people just pay it.
>
> TrueConsent reads your EOB, decodes every code, finds what's wrong, and handles the fight — including making the call to your insurance company.

---

## The problem

When you receive care, three things happen simultaneously that most patients don't know how to navigate:

1. **The bill is opaque.** CPT codes, ICD-10 diagnosis codes, CARC denial reason codes — none of it is explained. Hospitals and insurers count on this.

2. **Denials are often wrong.** Studies show 40–50% of claim denials are incorrect. Most patients never appeal because they don't know they can, don't know how, or run out of time.

3. **There's a legal escalation path nobody uses.** The ACA mandates a four-level appeals process that overturns the majority of wrongful denials. Almost no one reaches level two.

TrueConsent automates all of it — from decoding the document to filing the final appeal.

---

## What it does

### 1. Decode any insurance document

Drop in an EOB, denial letter, itemized hospital bill, prior authorization denial, or Summary of Benefits. TrueConsent classifies the document type automatically and decodes every code on it.

**This is not AI guessing.** CPT codes, ICD-10 diagnosis codes, CARC denial reason codes, RARC remark codes, HCPCS supply codes, CPT modifiers, and Place of Service codes are all public lookup tables published by CMS. We look them up deterministically before the AI touches anything. The AI's job is to explain what those decoded facts mean for you — not to infer what the codes might mean.

```
CPT 99285  →  Emergency department visit, high medical decision complexity
ICD-10 J18.9  →  Pneumonia, unspecified
CO-50  →  Payer determined service not medically necessary
          ↳ For pneumonia + ER visit: this denial is almost certainly wrong
          ↳ Appeal success rate: 94% for this ICD-10/CPT pairing
```

### 2. Show you what's actually wrong

After decoding, the engine runs a set of deterministic rule checks — no LLM involved:

- **Math check** — billed minus allowed minus adjustments must equal patient responsibility. Arithmetic errors in your favor are common.
- **Duplicate detection** — same CPT code billed twice on the same service date.
- **Upcoding flags** — high-severity E&M codes (99215) without supporting diagnosis.
- **Pairing analysis** — diagnosis codes that always justify the procedure flagged as medically necessary denials.
- **Coverage period check** — service date vs. active policy dates.
- **Unbundling detection** — multiple codes billed when one bundled code should apply.
- **Modifier audit** — modifier 59 abuse (used to bypass bundling rules).

### 3. Show you exactly what you owe vs. what you should owe

```
                     Billed      Ins. Paid     You Owe     Status
ER visit (99285)    $1,847          $0           ???       ✗ Fight this
Chest X-ray (71046)   $612        $489           $76       ✓ Correct
Blood draw (36415)     $45         $36            $9       ✓ Correct
Antibiotic (J0696)    $280          $0           ???       ✗ Review needed
─────────────────────────────────────────────────────────────────
Total               $2,784        $525           $85  +  $2,127 in dispute
```

The headline number: **what you were about to pay vs. what you actually owe.**

### 4. Handle the escalation automatically

Insurance has a legal appeals process with four levels. We manage all of them:

| Level | What it is | Who handles it | Overturn rate |
|---|---|---|---|
| 0 | Internal review call | We call for you (Bland AI) | ~60% of wrongful denials |
| 1 | Internal written appeal | We draft and send the letter | Additional ~20% |
| 2 | External Independent Review (IRO) | We file with the independent reviewer | ~40% of remaining |
| 3 | State Insurance Commissioner complaint | We auto-fill the state form | Often resolves before review |

The patient approves each escalation. We prepare everything. Deadlines are tracked automatically.

### 5. Call the insurance company for you

Instead of 45 minutes on hold explaining denial codes to someone reading from a script:

1. Click **"Call insurance for me"**
2. Sign a Representative Authorization (pre-filled, takes 10 seconds)
3. Watch the live transcript as our agent navigates the IVR, reaches a representative, and files the appeal
4. Receive the reference number and resolution timeline

```
[0:04] Connected to insurer automated system
[0:31] Navigating to appeals department
[1:47] On hold
[3:12] Connected to representative
[3:18] Agent: "I'm calling regarding claim #48291, denied CO-50..."
[5:44] Representative: "Appeal initiated. Reference: AP-2847"
[6:03] Done. Appeal on file. Resolution by July 29.
```

---

## Documents we handle

| Document | What we extract | Key action |
|---|---|---|
| Explanation of Benefits (EOB) | All claim lines, denial codes, amounts | Decode, flag errors, trigger appeal |
| Denial letter | Denial reason, procedure, date | Identify appeal path, draft response |
| Itemized hospital bill | Every line item with revenue codes | Audit for billing errors, request corrections |
| Prior authorization denial | Auth code, clinical reason | Clinical exception letter to medical director |
| Summary of Benefits (SBC) | Deductible, OOP max, copay structure | Used to validate every subsequent EOB |
| Collection notice | Collector identity, amount, original creditor | FDCPA dispute letter within 30-day window |

---

## How the analysis works

### Step 1 — Text extraction

For PDF uploads, we extract raw text using `pdf-parse` before the file touches the LLM. This gives us a character-accurate document to run rule checks against.

### Step 2 — Code extraction and lookup

Every recognized code pattern is extracted from the text and looked up in local reference tables:

```
lib/codes/
  cpt.json         ~200 common procedure codes
  icd10.json       ~1000 common diagnosis codes
  carc.json        All 250 Claim Adjustment Reason Codes + appeal notes
  rarc.json        Top 100 Remittance Advice Remark Codes
  modifiers.json   ~50 CPT modifier codes
  hcpcs.json       ~100 common supply and drug codes
  pos.json         Place of Service codes
```

This lookup is deterministic — no inference, no hallucination risk on the codes themselves.

### Step 3 — Deterministic rule engine

The check engine runs independently of the LLM:

```
lib/checks/
  extractText.ts       PDF text extraction
  codeExtractor.ts     Regex-based code detection + lookup
  modality.ts          Document type classification (weighted scoring)
  patterns.ts          High-risk clause and billing error patterns
  quoteVerification.ts Fuzzy-match LLM quotes against source text
  requiredElements.ts  Structural completeness check
  math.ts              Billed/allowed/responsibility arithmetic
  pairing.ts           ICD-10 + CPT medical necessity cross-reference
  taxonomy.ts          Clause classification by type
  index.ts             Orchestrator — returns DeterministicChecks struct
```

Each check returns structured data with a severity level and human-readable explanation. These results are passed to the LLM as grounded facts, not questions.

### Step 4 — LLM analysis (Claude via TokenRouter)

The LLM receives the decoded document — codes already translated, rule-check findings already surfaced. Its job is to:

- Write a plain-English summary of what happened
- Explain each denial in language a non-medical person understands
- Generate the call script tailored to the specific insurer and denial code
- Draft the appeal letter with clinical citations appropriate to the diagnosis
- Identify what additional documents are needed to strengthen the appeal

The LLM is forced to call a single `emit_analysis` tool — structured JSON output, no free-form text, no parsing fragility.

### Step 5 — Trust score

A trust score (0–100) is computed from:
- How many LLM red-flag quotes were verified verbatim or fuzzy-matched against the source document
- Structural completeness of the document
- Math consistency

Every flag shown in the UI displays its verification status (`✓ verbatim`, `~ fuzzy`, `! unverified`).

---

## Running locally

```bash
cp .env.example .env.local       # add your TokenRouter API key
npm install
npm run dev
```

Open `http://localhost:3000`.

**Demo mode (no API key required):**

```
http://localhost:3000/?demo=surgery
```

Loads a pre-cached analysis of the surgery mock — full decoded result, verification panel, all UI — zero API dependency. Use this as your fallback during any live demo.

### Environment variables

```bash
# Required for live uploads
tokenrouter=your_tokenrouter_key

# Optional
TOKENROUTER_MODEL=anthropic/claude-opus-4.7   # default
TOKENROUTER_BASE_URL=https://api.tokenrouter.com

# Required for call feature
BLAND_API_KEY=your_bland_key
NEXT_PUBLIC_BASE_URL=https://your-deploy-url.vercel.app
```

---

## Mock documents

`consent-form-mocks/` contains six sample PDFs generated by `tools/generate_mock_consent_forms.py`. Each is a realistic fictional document with modality-specific content:

| File | Modality | Key features |
|---|---|---|
| `general-medical-consent-form.pdf` | General | Privacy clauses, financial responsibility |
| `surgery-consent-form.pdf` | Surgery | Anesthesia sub-consent (CONS-310), malignant hyperthermia disclosure |
| `imaging-consent-form.pdf` | Imaging | ALARA radiation table, iodinated/gadolinium contrast risks |
| `telehealth-consent-form.pdf` | Telehealth | Connection-failure procedure, cross-state licensing, recording consent |
| `dental-implant-consent-form.pdf` | Dental implant | Titanium, sinus lift, osseointegration, bone graft |
| `orthodontics-consent-form.pdf` | Orthodontics | Aligner-specific risks, tooth movement disclosure |

Regenerate all six:

```bash
uv run --with reportlab python3 tools/generate_mock_consent_forms.py
```

---

## HIPAA approach

TrueConsent is designed with HIPAA-readiness as a first-class constraint:

- **No storage** — uploaded files are processed in memory and discarded. No PHI is written to disk, database, or logs on our side.
- **No LLM caching of PHI** — the `no-store` cache directive is set on `/api/analyze` responses.
- **Session-only** — nothing persists between sessions. Refresh and the document is gone.
- **Deterministic checks run locally** — code lookups never touch the API. Only the summary/appeal generation sends content to the LLM.
- **Call recordings** — the Bland AI integration records calls solely to extract the reference number and transcript. Recordings are deleted after extraction. The patient is disclosed at call start that the call may be recorded.
- **Representative Authorization** — before any call is made on a patient's behalf, we generate and collect a signed CMS-1696-equivalent authorization. This is stored only for the duration of the appeal, then deleted.

For production deployment, BAAs are required with TokenRouter and Bland AI. Anthropic offers enterprise BAAs. This architecture is designed so that adding BAAs is the only remaining step to full HIPAA compliance.

> TrueConsent does not provide medical, legal, or financial advice. It does not replace an attorney, physician, or qualified insurance professional. It is a tool to help patients understand their documents and exercise rights they already have.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| LLM | Claude (`anthropic/claude-opus-4.7`) via TokenRouter |
| PDF text extraction | `pdf-parse` |
| Outbound calls | Bland AI |
| Code references | CMS public data (CPT, ICD-10, CARC, RARC) |
| Mock PDF generation | Python + ReportLab |
| Development workflow | Lightsprint (task tracking), Reboot (Claude skills) |

---

## Project layout

```
app/
  layout.tsx                    Top bar + disclaimer banner
  page.tsx                      State machine: idle → uploading → scanning → results
  globals.css                   Design tokens, scan animation, verification panel styles
  api/
    analyze/route.ts            POST handler — extract, decode, check, analyze
    initiate-call/route.ts      Triggers Bland AI outbound call
    call-status/route.ts        Webhook for call transcript updates

components/
  Dropzone.tsx                  File upload with camera capture (mobile)
  UploadingCard.tsx             Upload progress
  ScanningCard.tsx              Scan animation
  Results.tsx                   Two-column results layout
  BillTable.tsx                 Decoded line-item breakdown with status colors
  SavingsBanner.tsx             "You were going to pay X, you owe Y"
  RedFlagRail.tsx               Sticky denial/flag list with verification badges
  RedFlagDrawer.tsx             Detail drawer with verification line + appeal draft
  VerificationPanel.tsx         Trust score, modality, quote grounding, required elements
  CallModal.tsx                 Live call transcript stream
  EscalationTimeline.tsx        Four-level appeal progress tracker
  ActionCard.tsx                "What to do right now" — single next step

lib/
  anthropic.ts                  Memoized SDK client (TokenRouter base URL)
  prompt.ts                     System prompt + emit_analysis tool schema
  types.ts                      All types: ClaimLine, DenialItem, DeterministicChecks, etc.
  format.ts                     File size / duration helpers
  insurers.ts                   Major insurer phone numbers + IVR patterns
  callScript.ts                 Builds Bland AI task from decoded claim
  checks/
    index.ts                    Orchestrator
    extractText.ts              PDF text via pdf-parse
    codeExtractor.ts            Regex code detection + lookup
    modality.ts                 Document type classification
    patterns.ts                 Billing error + high-risk clause patterns
    quoteVerification.ts        LLM quote fuzzy-matching
    requiredElements.ts         Structural completeness
    math.ts                     Arithmetic validation
    pairing.ts                  ICD-10 + CPT necessity cross-reference
    taxonomy.ts                 Clause type classification
  codes/
    cpt.json                    CPT procedure codes
    icd10.json                  ICD-10 diagnosis codes
    carc.json                   Claim Adjustment Reason Codes (with appeal notes)
    rarc.json                   Remittance Advice Remark Codes
    modifiers.json              CPT modifier codes
    hcpcs.json                  Supply and drug codes
    pos.json                    Place of Service codes

public/
  demo/
    surgery.json                Pre-cached surgery demo (use ?demo=surgery)

tools/
  generate_mock_consent_forms.py  Generates the six mock PDFs
  test_checks.mjs                 Smoke-tests the check engine against all mocks
```

---

## Sponsor stack

This project was built at the hackathon using:

- **[TokenRouter](https://api.tokenrouter.com)** — LLM routing. All Claude calls go through TokenRouter, enabling model switching, cost tracking, and failover without code changes.
- **[Lightsprint](https://lightsprint.ai)** — AI-assisted development. Every PR in this repo was generated or reviewed through Lightsprint task tracking (visible in PR descriptions).
- **[Reboot](https://reboot.dev)** — Claude Code skills. The `reboot-chat-app` skill is enabled in `.claude/settings.json`, giving the whole team shared Claude Code tooling.
- **[Bland AI](https://www.bland.ai)** — Outbound AI phone calls. Powers the "call insurance for me" feature.
- **[Anthropic Claude](https://www.anthropic.com)** — `claude-opus-4.7` for document analysis, appeal generation, and call scripting.
