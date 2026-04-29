export interface InsurerInfo {
  name: string;
  appealsPhone: string;
  memberServicesPhone: string;
  ivrHint: string;
  avgHoldMinutes: number;
}

// For demo, DEMO_PHONE is overridden by NEXT_PUBLIC_DEMO_PHONE env var.
// In production every entry points to the real appeals line.
const DEMO_PHONE = process.env.NEXT_PUBLIC_DEMO_PHONE ?? "1-800-555-0199";

const INSURERS: Record<string, InsurerInfo> = {
  "BlueCross BlueShield": {
    name: "BlueCross BlueShield",
    appealsPhone: DEMO_PHONE,
    memberServicesPhone: "1-800-835-8699",
    ivrHint: "Say 'appeals' at the main menu, then press 2 for claims.",
    avgHoldMinutes: 18,
  },
  "BlueCross": {
    name: "BlueCross BlueShield",
    appealsPhone: DEMO_PHONE,
    memberServicesPhone: "1-800-835-8699",
    ivrHint: "Say 'appeals' at the main menu, then press 2 for claims.",
    avgHoldMinutes: 18,
  },
  "Aetna": {
    name: "Aetna",
    appealsPhone: DEMO_PHONE,
    memberServicesPhone: "1-800-872-3862",
    ivrHint: "Press 2 for claims and benefits, then 3 for appeals.",
    avgHoldMinutes: 22,
  },
  "UnitedHealthcare": {
    name: "UnitedHealthcare",
    appealsPhone: DEMO_PHONE,
    memberServicesPhone: "1-866-801-4409",
    ivrHint: "Press 1 for member services, say 'appeal' when prompted.",
    avgHoldMinutes: 25,
  },
  "UHC": {
    name: "UnitedHealthcare",
    appealsPhone: DEMO_PHONE,
    memberServicesPhone: "1-866-801-4409",
    ivrHint: "Press 1 for member services, say 'appeal' when prompted.",
    avgHoldMinutes: 25,
  },
  "Cigna": {
    name: "Cigna",
    appealsPhone: DEMO_PHONE,
    memberServicesPhone: "1-800-244-6224",
    ivrHint: "Press 2 for claims, then 4 for appeals and grievances.",
    avgHoldMinutes: 20,
  },
  "Humana": {
    name: "Humana",
    appealsPhone: DEMO_PHONE,
    memberServicesPhone: "1-800-444-9137",
    ivrHint: "Say 'appeals department' at the main menu.",
    avgHoldMinutes: 15,
  },
};

const DEFAULT: InsurerInfo = {
  name: "Your Insurance Company",
  appealsPhone: DEMO_PHONE,
  memberServicesPhone: DEMO_PHONE,
  ivrHint: "Ask for the appeals or grievances department.",
  avgHoldMinutes: 20,
};

export function lookupInsurer(name: string | undefined): InsurerInfo {
  if (!name) return DEFAULT;
  const key = Object.keys(INSURERS).find((k) =>
    name.toLowerCase().includes(k.toLowerCase())
  );
  return key ? INSURERS[key] : { ...DEFAULT, name };
}
