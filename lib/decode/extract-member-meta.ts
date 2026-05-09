export interface EobMemberMeta {
  memberId?: string;
  claimId?: string;
  patientName?: string;
  insurerName?: string;
  providerName?: string;
  serviceDate?: string;
  admittingDiagnosisCode?: string;
}

function cleanInlineField(value: string | undefined): string | undefined {
  return value
    ?.replace(/\s+(Member ID|Group Number|Plan Name|Claim (?:Number|#|No)\.?)\b.*$/i, "")
    .trim();
}

export function extractEobMemberMeta(text: string): EobMemberMeta {
  const memberIdMatch = text.match(/Member\s+ID[:\s]+([A-Z0-9-]+)/i);
  const claimIdMatch = text.match(/Claim\s+(?:Number|#|No)[.:\s]+([A-Z0-9-]+)/i);
  const memberNameMatch = text.match(/Member\s+Name[:\s]+([^\n\r]+)/i);
  const insurerNameMatch = text.match(
    /^(BlueCross[^\n\r]*|Aetna[^\n\r]*|UnitedHealth[^\n\r]*|Cigna[^\n\r]*|Humana[^\n\r]*)/im
  );
  const providerMatch = text.match(
    /^Provider(?:\s*:|\s+)(?!&\s*SERVICE\b)([^\n\r]+)/im
  );
  const serviceDateMatch = text.match(
    /Date\s+of\s+Service[:\s]+([A-Za-z]+ \d{1,2},? \d{4}|\d{2}\/\d{2}\/\d{4})/i
  );
  const diagnosisMatch = text.match(/Admitting\s+Diagnosis[:\s]+([A-Z]\d{2}\.?\d*)/i);

  let serviceDate: string | undefined;
  if (serviceDateMatch?.[1]) {
    const raw = serviceDateMatch[1];
    const d = new Date(raw);
    if (!isNaN(d.getTime())) serviceDate = d.toISOString().split("T")[0];
  }

  return {
    memberId: memberIdMatch?.[1]?.trim(),
    claimId: claimIdMatch?.[1]?.trim(),
    patientName: cleanInlineField(memberNameMatch?.[1]),
    insurerName: insurerNameMatch?.[1]?.trim(),
    providerName: providerMatch?.[1]?.trim(),
    serviceDate,
    admittingDiagnosisCode: diagnosisMatch?.[1],
  };
}
