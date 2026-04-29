// Exercise decodeClaim against several common EOB table layouts.
//
// Run with: npx tsx tools/test_decode.mjs

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const { decodeClaim } = await import(path.join(repoRoot, "lib/decode.ts"));

const fixtures = [
  {
    name: "BlueCross",
    text: `EXPLANATION OF BENEFITS
BlueCross BlueShield of Illinois
Member Services: 1-800-835-8699
PO Box 805107, Chicago, IL 60680

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEMBER INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Member Name:      Jane Q. Smith
Member ID:        BCB-2204819334
Group Number:     GRP-00471920
Plan Name:        PPO Gold 1500
Claim Number:     48291
Date of Service:  June 14, 2026
Provider:         Memorial Hospital Emergency Department
                  2100 W. Harrison St., Chicago, IL 60612
                  NPI: 1234567890
Date Processed:   June 28, 2026
Admitting Diagnosis: J18.9 — Pneumonia, unspecified organism

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERVICE LINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Line  Date        Procedure  Description                     Billed    Allowed   Paid      Patient   Denial
----  ----------  ---------  ------------------------------  --------  --------  --------  --------  ------
1     06/14/2026  99285      ER visit, high complexity MDM   $1847.00  $0.00     $0.00     $0.00     CO-50, RARC N130
2     06/14/2026  71046      Chest X-ray 2 views             $612.00   $565.00   $489.00   $76.00    PR-1
3     06/14/2026  36415      Routine venipuncture            $45.00    $45.00    $36.00    $9.00     PR-1
4     06/14/2026  J0696      Ceftriaxone injection 250mg     $280.00   $0.00     $0.00     $0.00     CO-4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLAIM TOTALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Billed:               $2784.00
Total Insurance Paid:       $525.00
Total Patient Responsibility: $85.00
Total Denied:               $2174.00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DENIAL CODE GLOSSARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CO-50:  Non-covered services — not deemed medically necessary by payer
CO-4:   Procedure code inconsistent with modifier used or required modifier missing
PR-1:   Deductible amount — patient responsibility
N130:   Remark: Your claim has been denied. A letter was sent to the provider describing how
        to resubmit for reconsideration. You may also appeal this decision.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPEAL RIGHTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You have the right to appeal this decision. You must file a Level 1 internal appeal within
180 days of receiving this notice. To begin an appeal, call Member Services at 1-800-835-8699
or submit your appeal in writing to: BlueCross BlueShield of Illinois, Appeals Department,
PO Box 805107, Chicago, IL 60680. Reference Claim Number 48291 on all correspondence.

This document is not a bill. Do not pay based on this notice.`,
  },
  {
    name: "Aetna",
    text: `EXPLANATION OF BENEFITS
Aetna Choice POS II
Member Name: Jane Q. Smith
Member ID: AET-2204819334
Claim Number: 48291
Date of Service: 06/14/2026
Provider: Memorial Hospital Emergency Department
Admitting Diagnosis: J18.9

Service Detail
Reason Code  Date        Code   Service Description              Charge Amount  Allowed   Plan Pays  Member Liability
PR-1         06/14/2026  36415  Routine venipuncture             $45.00         $45.00    $36.00     $9.00
CO-4         06/14/2026  J0696  Ceftriaxone injection 250mg      $280.00        $0.00     $0.00      $0.00
CO-50        06/14/2026  99285  ER visit, high complexity MDM    $1847.00       $0.00     $0.00      $0.00
PR-1         06/14/2026  71046  Chest X-ray 2 views              $612.00        $565.00   $489.00    $76.00

Totals
Charge Amount $2784.00
Plan Pays $525.00
Member Liability $85.00

Reason Code Descriptions
CO-50 Non-covered services not deemed medically necessary by payer
CO-4 Procedure code inconsistent with modifier used or required modifier missing
PR-1 Deductible amount patient responsibility`,
  },
  {
    name: "UnitedHealthcare",
    text: `UnitedHealthcare Explanation of Benefits
Member Name: Jane Q. Smith
Member ID: UHC-2204819334
Claim No: 48291
Date of Service: June 14, 2026
Provider: Memorial Hospital Emergency Department
Admitting Diagnosis: J18.9

Claim Details
Remark       Procedure  Description                   Billed Charges  Negotiated Amount  Paid by Plan  You May Owe
PR-1         71046      Chest X-ray 2 views           $612.00         $565.00            $489.00       $76.00
CO-50 N130   99285      ER visit high complexity      $1847.00        $0.00              $0.00         $0.00
PR-1         36415      Routine venipuncture          $45.00          $45.00             $36.00        $9.00
CO-4         J0696      Ceftriaxone injection 250mg   $280.00         $0.00              $0.00         $0.00

Claim Summary
Billed Charges $2784.00
Paid by Plan $525.00
You May Owe $85.00

Remark Descriptions
CO-50 Non-covered services not deemed medically necessary by payer
CO-4 Procedure code inconsistent with modifier used or required modifier missing
PR-1 Deductible amount patient responsibility`,
  },
];

const rows = [];

for (const fixture of fixtures) {
  const claim = await decodeClaim(fixture.text);
  const hasCodedDenial = claim.denials.some((denial) =>
    ["CO-50", "CO-4"].includes(denial.carc.code)
  );

  assert(claim.lines.length >= 2, `${fixture.name}: expected at least 2 lines`);
  assert(claim.totals.billed > 0, `${fixture.name}: expected billed total > 0`);
  assert(hasCodedDenial, `${fixture.name}: expected a CO-50 or CO-4 denial`);

  rows.push({
    fixture: fixture.name,
    lines: claim.lines.length,
    "totals.billed cents": claim.totals.billed,
    "denials count": claim.denials.length,
    extractionMethod: claim.extractionMethod ?? "",
  });
}

console.table(rows);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
