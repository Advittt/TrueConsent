# TrueConsent

TrueConsent is a hackathon MVP for helping patients understand medical consent forms before they sign them.

The app lets a user upload a medical consent form, scans the document, and returns a plain-language explanation of what the form says. The goal is to make dense consent language easier to understand by summarizing the agreement, highlighting important obligations, and calling out clauses that may deserve extra attention.

## Problem

Medical consent forms are often long, technical, and difficult to read quickly. Patients may sign without fully understanding what procedure, data usage, financial responsibility, or risk disclosure they are agreeing to.

TrueConsent is designed to give users a lightweight explanation layer so they can feel more informed before continuing.

## MVP Scope

For the initial MVP, TrueConsent will:

- Accept an uploaded medical consent form.
- Extract readable text from the document.
- Summarize the consent form in plain language.
- Explain what the user appears to be agreeing to.
- Identify potential red flags or sections that may need closer review.
- Present the result in a simple, user-friendly interface.

## Important Disclaimer

TrueConsent does not provide medical, legal, or financial advice. It does not replace a doctor, attorney, hospital staff member, or qualified professional.

The product is intended only to explain consent form language in simpler terms and help users identify questions they may want to ask before signing.

## Target Users

- Patients reviewing medical consent forms.
- Caregivers helping family members understand documents.
- Clinic or hospital intake teams looking for clearer patient communication.

## Example Output

After uploading a consent form, a user may receive:

- A short summary of the form.
- A list of key things they are agreeing to.
- A plain-language explanation of risks, permissions, and responsibilities.
- A red-flag section for confusing, broad, or high-impact clauses.
- Suggested questions to ask a medical professional.

## Hackathon Goal

Build an end-to-end working demo that shows the full user flow:

1. Upload a medical consent form.
2. Extract and analyze the form text.
3. Generate a plain-language explanation.
4. Display the summary, agreement points, and red flags clearly.

## Project Status

TrueConsent is currently in early hackathon MVP development.

## Running locally

The MVP is a Next.js (App Router) app. From the repo root:

```bash
cp .env.example .env.local       # then paste your TokenRouter API key
npm install
npm run dev
```

Then open <http://localhost:3000>.

Claude requests are routed through [TokenRouter](https://api.tokenrouter.com)
using the `tokenrouter` env var. The default model is
`anthropic/claude-opus-4.5`; override with `TOKENROUTER_MODEL` if you want a
different vision-capable model. The base URL can be overridden with
`TOKENROUTER_BASE_URL`.

### How the analysis works

1. The user drops a PDF or image (PNG, JPG, WEBP, GIF) into the upload area
   on `/`.
2. The browser POSTs the file as `multipart/form-data` to `/api/analyze`.
3. The route base64-encodes the file and sends it directly to Claude as a
   `document` (PDF) or `image` content block — no separate OCR step.
4. Claude is forced to call a single `emit_analysis` tool whose JSON schema
   matches the `Analysis` type in `lib/types.ts`. That guarantees the
   response is parseable structured data.
5. The page transitions through `idle → uploading → scanning → results` and
   renders the analysis in a two-column layout with a sticky red-flag rail.

### API route shape

`POST /api/analyze` (multipart, field `file`)

Response:

```jsonc
{
  "analysis": {
    "summary": "...",
    "agreements": ["..."],
    "risks": ["..."],
    "redFlags": [
      {
        "id": "flag-1",
        "severity": "high" | "medium" | "low",
        "title": "...",
        "why": "...",
        "quote": "...",
        "ask": "..."
      }
    ],
    "doctorQuestions": ["..."]
  },
  "fileName": "consent.pdf",
  "fileSize": 102400,
  "durationMs": 11400
}
```

Errors come back as `{ "error": "..." }` with a 4xx/5xx status.

### Sample forms

`consent-form-mocks/` contains three sample PDFs you can drop in to demo the
flow without a real form:

- `general-medical-consent-form.pdf`
- `orthodontics-consent-form.pdf`
- `surgery-consent-form.pdf`

### Project layout

```
app/
  layout.tsx          # top bar + persistent disclaimer banner
  page.tsx            # idle → uploading → scanning → results state machine
  globals.css         # design tokens + scan animation + drawer styles
  api/analyze/route.ts# POST handler that calls Claude with the file
components/
  Dropzone.tsx
  UploadingCard.tsx
  ScanningCard.tsx
  Results.tsx
  RedFlagRail.tsx
  RedFlagDrawer.tsx
lib/
  anthropic.ts        # memoized SDK client + model id
  prompt.ts           # system prompt + emit_analysis tool schema
  types.ts            # Analysis / RedFlag types
  format.ts           # file size / duration helpers
```
