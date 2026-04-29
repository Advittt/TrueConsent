# EOB Test Fixtures

Synthetic Explanation of Benefits (EOB) PDFs used to verify TrueConsent's claim decoder and appeal-letter generator. All data is fabricated — no real patient information.

Each file exercises a distinct denial pattern so the decoder is validated across the most common real-world scenarios.

## Fixtures

| File | Insurer | Scenario | Denial Codes |
|------|---------|----------|--------------|
| `bluecross-eob-sample.pdf` | BlueCross BlueShield IL | ER visit — medical necessity denial + deductible | CO-50, CO-4, PR-1 |
| `aetna-eob-sample.pdf` | Aetna | Mental health therapy — prior-auth limit exceeded | CO-97, PR-1 |
| `uhc-eob-sample.pdf` | UnitedHealthcare | Out-of-network ER + timely filing denial | CO-100, CO-29 |

## What each fixture covers

**BlueCross (`bluecross-eob-sample.pdf`)**
- CO-50: medical necessity denial (ER visit not covered)
- CO-4: missing modifier on drug injection
- PR-1: standard deductible
- Mix of full denial and partial payment lines

**Aetna (`aetna-eob-sample.pdf`)**
- CO-97: prior-authorization cap exceeded — sessions 4 and 5 of 5 denied
- Partial approval (first 3 sessions paid), full denial on remainder
- Mental health parity context (F33.1 diagnosis)

**UHC (`uhc-eob-sample.pdf`)**
- CO-100: out-of-network penalty applied to emergency services
- CO-29: timely filing expiration (fracture reduction billed 74 days late)
- No Surprises Act appeal pathway referenced

## Generating

```bash
uv run --with reportlab python tools/generate_mock_eob.py        # BlueCross
uv run --with reportlab python tools/generate_mock_eob_aetna.py  # Aetna
uv run --with reportlab python tools/generate_mock_eob_uhc.py    # UHC
```

## Decoder validation

Run against the live `/api/checks` endpoint:

```bash
curl -X POST http://localhost:3000/api/checks \
  -F "file=@eob-mocks/bluecross-eob-sample.pdf" | jq .

curl -X POST http://localhost:3000/api/checks \
  -F "file=@eob-mocks/aetna-eob-sample.pdf" | jq .

curl -X POST http://localhost:3000/api/checks \
  -F "file=@eob-mocks/uhc-eob-sample.pdf" | jq .
```
