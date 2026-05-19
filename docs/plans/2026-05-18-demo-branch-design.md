# Demo branch design — fully mocked TrueConsent

**Branch:** `demo`
**Goal:** Convert the app into a fully mocked, clickthrough-only demo for public hosting. No APIs, no env vars, no backend cost. Waitlist capture is out of scope for this pass.

## Current state

The app has two parallel flows in `app/page.tsx`:

1. **Sample flow** (`isSample = true`) — hardcoded `SAMPLE_CLAIM` and `SAMPLE_APPEAL` constants. No API calls for claim or appeal data.
2. **Real upload flow** (`isSample = false`) — `POST /api/analyze-claim` parses the PDF and calls Anthropic via TokenRouter to generate a fresh appeal letter.

Both flows share `handleCall`, which always hits `/api/initiate-call` and then polls `/api/call-status`. The server-side call mock uses a module-scoped `_demoStart` that does not survive serverless cold starts and races across concurrent users.

`AnalyzeStep` is already a pure client-side timer with no API dependency.

## Target state

One path only — the sample flow, with the call animation moved client-side. Zero API routes, zero env vars, hostable as a static export.

## Changes

### Delete

- `app/api/analyze-claim/`
- `app/api/initiate-call/`
- `app/api/call-status/`
- `lib/anthropic.ts`, `lib/extract-pdf-text.ts`, `lib/extract-with-llm.ts`, `lib/appeal-letter.ts`, `lib/decode.ts`, `lib/codes/`
- `eob-mocks/`
- `tools/`
- `.env.example` (or blank it)

### New file — `lib/demo-data.ts`

Exports moved out of `app/page.tsx` plus the transcript lifted from the deleted call-status route:

- `SAMPLE_CLAIM` — Sarah Mitchell, BCBS, $3,847 denied
- `SAMPLE_APPEAL` — templated letter, only the date is dynamic
- `DEMO_TRANSCRIPT` — TranscriptLine[] with `t` (seconds), `speaker`, `text`. Rewritten to use Sarah's claim details, not the Jane Smith / CO-50 / pneumonia placeholders from the old API mock.
- `DEMO_CALL_DURATION_MS = 25000`
- `DEMO_CALL_REFERENCE = 'AP-2847'`

### `components/claim/CallStep.tsx` refactor

Replace the polling `useEffect` (lines 44-76) with a client-side timer.

**Props change:**
- Remove: `callId`, `pollInterval`
- Add: `transcript: TranscriptLine[]`, `durationMs: number`, `referenceNumber: string`

**Behavior:**
- Single `useEffect` with `setInterval(tick, 100)` incrementing `elapsedMs`
- Visible transcript = `transcript.filter(l => l.t <= elapsedMs / 1000)`
- Status derived from elapsed time using the same thresholds the server mock used (`dialing` → `on_hold` → `connected` → `complete`)
- Clear interval at `durationMs`, then trigger win banner after 600ms (matches today)
- Cleanup return on `useEffect` handles unmount mid-call and StrictMode double-mount (same pattern as the `318c4c5` appeal-letter fix)

### `components/claim/UploadStep.tsx` refactor

Single CTA — no drag-and-drop, no file input.

- Delete: dropzone div, file input, drag handlers, "or" divider, file-ready state
- Replace with one primary button: "Watch the demo"
- Keep: hero headline, sub-copy, trust row, stats row
- Prop change: `onUpload: (file: File | 'sample') => void` → `onStart: () => void`

### `app/page.tsx` refactor

- Delete: `SAMPLE_CLAIM`, `SAMPLE_APPEAL`, `mapApiResponse`, `AnalyzeClaimResponse` import, `isSample`/`setIsSample`, `callId`/`setCallId`, `fileName`/`setFileName`
- Import `SAMPLE_CLAIM`, `SAMPLE_APPEAL`, `DEMO_TRANSCRIPT`, `DEMO_CALL_DURATION_MS`, `DEMO_CALL_REFERENCE` from `lib/demo-data`
- `handleUpload` → `handleStart`: just `setStep('analyze')` (also reset `claim`/`appeal` so re-runs are fresh)
- `handleAnalyzeDone` → `setClaim(SAMPLE_CLAIM); setStep('results')`
- `handleAppeal` → `setStep('appeal'); setAppeal(SAMPLE_APPEAL)`
- `handleCall` → `setStep('call')`
- `CallStep` rendered with `transcript={DEMO_TRANSCRIPT}` etc. directly

### Cleanup

**`package.json`** — remove deps:
- `@anthropic-ai/sdk`
- `pdf-parse`
- `@types/pdf-parse`
- `tsx`
- `i` (accidental install, unused)

Re-run `npm install` to regenerate the lockfile.

**`next.config.ts`** — add `output: 'export'` for static hosting. All API routes are gone, so this works cleanly.

**`AGENTS.md` / `README.md`** — strip the TokenRouter setup section. Add a one-line note: "Demo branch — fully mocked, no APIs."

## Out of scope (deferred)

- Waitlist email capture (landing page + persistent CTA) — separate pass
- Multi-persona demo gallery (`eob-mocks/`) — deleted now, can be resurrected from git history if needed later

## Verification

- `npm run build` succeeds with zero API routes
- `npm run dev` → click "Watch the demo" → analyze → results → appeal → call → win banner appears at ~25s
- Clicking "← New claim" mid-call cleanly cancels the timer (no leaked intervals, no doubled animations)
- `npm run typecheck` clean
- `npm run lint` clean
