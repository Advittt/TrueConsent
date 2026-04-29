# TrueConsent — Hackathon Demo Script

**Target time: 5 minutes**  
**URL: localhost:3000 (or deployed URL)**  
**Key URL: /?demo=eob for instant failsafe**

---

## The Numbers (know these cold)

- **1 in 5** insurance claims gets denied (19-20% denial rate, KFF 2024)
- **Less than 1%** of denied claims are ever appealed
- **70%** of "not medically necessary" denials are overturned when challenged
- **52%** industry-wide overturn rate on all appeals
- **$265 billion** spent annually fighting denials — most of which get paid anyway
- **CO-50** (not medically necessary) has a **62% overturn rate** in our data

---

## Pacing Guide (5 min total)

| Section | Time |
|---|---|
| Opening hook | 0:00 – 0:30 |
| Problem setup | 0:30 – 1:00 |
| Load EOB + savings banner | 1:00 – 1:45 |
| Deterministic pipeline | 1:45 – 3:00 |
| Call insurance feature | 3:00 – 4:00 |
| Appeal letter + close | 4:00 – 4:30 |
| Sponsor stack | 4:30 – 5:00 |

---

## Opening (30 sec)

> "1 in 5 insurance claims gets denied. Less than 1% of people appeal — even though 7 in 10 'not medically necessary' denials get overturned when they do. That's $265 billion sitting on the table every year. We built TrueConsent to pick it up."

---

## The Problem (30 sec)

> "You get this document in the mail — an Explanation of Benefits. It's 4 pages of medical codes, abbreviations, and denial reasons. CO-50 means something specific. CO-97 means something specific. Most people have no idea what any of it means. They throw it in a drawer, assume the insurance company is right, and eat the cost."

> "The insurance companies know this. That's why less than 1% of people appeal — and why the ones who do win 7 times out of 10. The system is designed to make you give up. We don't give up."

---

## Live Demo — Load the EOB (45 sec)

*Click "ER visit (BlueCross)" demo button*

> "I'm going to load a real EOB layout right now. Watch what happens."

*Savings banner appears showing $2,127*

> "In under two seconds: $2,127 in potentially recoverable money."

> "Two denied services. A 99285 — high complexity ER visit. And J0696 — a ceftriaxone antibiotic injection. Both denied CO-50: not medically necessary."

> "Here's the thing — the admitting diagnosis was J18.9. Pneumonia. An ER visit for pneumonia IS medically necessary by clinical definition. The insurance company is wrong, and we can prove it."

---

## The Deterministic Argument (60 sec)

*Click "▼ Show how this was built"*

> "This is not an AI guessing. This is a four-step deterministic pipeline."

> "Step 1 — regex parser reads the raw EOB text. No model at this step."

> "Step 2 — every single code gets looked up in a local CMS-published table. CPT 99285 — found in our 78-code CPT table. Emergency department visit, high complexity. ICD-10 J18.9 — found in our 48-code ICD-10 table. Pneumonia, unspecified. CARC CO-50 — found in our 38-code denial table. Not medically necessary. The LLM cannot invent a code. If it's not in the table, it gets rejected."

> "Step 3 — we re-sum every service line independently and check it against the EOB totals. They match to within a dollar. The math is right."

> "Step 4 — CO-50 has a 62% historical overturn rate. That's not a guess — that's from CMS appeal outcome data. We know this denial is worth fighting."

---

## The Call Feature (60 sec)

*Scroll up to the "Call insurance for me" CTA*

> "Now the hard part — actually filing the appeal. Average hold time with BlueCross is 18 minutes. Most people give up after 5. We don't give up."

*Click "📞 Call insurance for me"*

> "We show you a representative authorization. ERISA Section 503 gives every patient the explicit legal right to have someone call on their behalf. Type your name, check the box — that's a legally sufficient authorization."

*Sign and submit — CallModal opens, transcript streams*

> "We navigate the IVR, reach a representative, cite the exact denial code, cite the admitting diagnosis, and file the Level 1 appeal. You watch the transcript live. No hold music for you."

> "At the end — a reference number. AP-2847. That's your appeal on record. 30-day resolution window. Written confirmation coming."

---

## Appeal Letter (30 sec)

*Scroll to appeal letter section*

> "And if they want it in writing — here's the appeal letter. Patient name, claim number, service date, denial codes, grounds for appeal — all pre-filled. It cites ERISA Section 503. It demands the reviewer's credentials. It gives them a 30-day deadline to respond or we escalate to an Independent Review Organization."

> "This letter took our system about 2 seconds to generate. It would take a patient 2 hours to write — if they even knew where to start."

---

## Sponsor Stack (30 sec)

> "The tech stack: **TokenRouter** routes every LLM call through their proxy — we can swap models without touching code, and we get unified logging across the whole pipeline. **Lightsprint** tracked every feature from EOB decode to the call flow. **Reboot** skills are integrated into our Claude Code setup — the `reboot-chat-app` skill is wired in and available for the next phase of the build."

> "We used Claude claude-opus-4.7 for the LLM extraction fallback and for generating the appeal letters. The deterministic layer — code lookup, reconciliation, denial scoring — runs locally with zero AI involvement."

> *Note for demo: Reboot is configured in `.claude/settings.json`. It's live in the repo — we'll invoke it in the next build session for the voice and escalation features.*

---

## Close (20 sec)

> "TrueConsent is free. If we recover money, we take a small success fee — zero risk to you. The data is deterministic. The appeal is real. The call — we actually make it."

> "$265 billion on the table. Less than 1% of people pick it up. We're changing that."

---

## Handling Questions

**"Is this legal?"**
> ERISA Section 503 explicitly grants patients the right to full and fair review of denied claims, and the right to designate a representative. We're facilitating that right — not acting as a legal representative.

**"How do you make money?"**
> Success fee — a small percentage of what we recover. Zero upfront. Zero if we fail.

**"What if the insurer won't talk to you?"**
> If the call fails, the appeal letter is ready to mail. We also escalate: internal appeal → written appeal → external Independent Review Organization → state insurance commissioner. Four levels.

**"Is the AI making medical decisions?"**
> No. The AI reads the layout. Every code is validated deterministically against CMS tables. The appeal grounds are based on the ICD-10 admitting diagnosis matching the denied CPT code — that's a clinical fact, not a model opinion.

**"What about HIPAA?"**
> Documents are processed in memory and discarded. No storage. Cache-Control: no-store. For production we'd sign BAAs with cloud providers — the architecture already supports it.

---

## Key Lines to Land

1. *"1 in 5 claims denied. Less than 1% appealed. 7 in 10 overturned when you do."*
2. *"The LLM reads the layout. The code table decides if it's real."*
3. *"62% overturn rate on CO-50. We know this is winnable."*
4. *"You watch the transcript. We make the call."*

---

*Sources: KFF (2024), AHA ($20B report), CounterForce Health, Healthcare Dive/JAMA study, CMS CARC data*
