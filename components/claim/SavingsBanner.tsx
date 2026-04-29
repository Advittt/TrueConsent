"use client";

import { formatMoney } from "@/lib/format-money";

interface SavingsBannerProps {
  billed: number;
  patientResponsibility: number;
  potentialSavings: number;
}

export function SavingsBanner({
  billed,
  patientResponsibility,
  potentialSavings,
}: SavingsBannerProps) {
  return (
    <div className="savings-banner">
      <div className="savings-banner-grid">
        {/* Left column: billed + you owe */}
        <div className="savings-banner-cols">
          <div className="savings-stat">
            <div className="savings-stat-label">Originally billed</div>
            <div className="savings-stat-value savings-stat-value--billed">
              {formatMoney(billed)}
            </div>
          </div>
          <div className="savings-divider" aria-hidden="true">→</div>
          <div className="savings-stat">
            <div className="savings-stat-label">You actually owe</div>
            <div className="savings-stat-value savings-stat-value--owe">
              {formatMoney(patientResponsibility)}
            </div>
          </div>
        </div>

        {/* Right column: hero savings */}
        <div className="savings-hero">
          <div className="savings-hero-eyebrow">Potential savings</div>
          <div className="savings-hero-number">
            {formatMoney(potentialSavings)}
          </div>
          <div className="savings-hero-sub">
            if both denials are overturned
          </div>
        </div>
      </div>
    </div>
  );
}
