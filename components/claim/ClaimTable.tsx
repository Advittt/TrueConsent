"use client";

import type { ClaimLine } from "@/lib/types/claim";
import { formatMoney } from "@/lib/format-money";

interface ClaimTableProps {
  lines: ClaimLine[];
}

const STATUS_BADGE: Record<ClaimLine["status"], { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "claim-badge claim-badge--paid" },
  denied: { label: "DENIED", cls: "claim-badge claim-badge--denied" },
  partial: { label: "Partial", cls: "claim-badge claim-badge--partial" },
  pending: { label: "Pending", cls: "claim-badge claim-badge--pending" },
};

export function ClaimTable({ lines }: ClaimTableProps) {
  return (
    <div className="card claim-table-card">
      <div className="card-eyebrow">Line items</div>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Claim breakdown</h2>

      <div className="claim-table">
        {/* Header */}
        <div className="claim-table-head">
          <span>Service</span>
          <span className="claim-col-num">Billed</span>
          <span className="claim-col-num">Ins. paid</span>
          <span className="claim-col-num">You owe</span>
          <span className="claim-col-status">Status</span>
        </div>

        {lines.map((line) => {
          const desc = line.cpt?.description ?? line.hcpcs?.description ?? "Unknown service";
          const code = line.cpt?.code ?? line.hcpcs?.code ?? null;
          const badge = STATUS_BADGE[line.status];
          const denial = line.denial;

          return (
            <div key={line.id} className={`claim-row${line.status === "denied" ? " claim-row--denied" : ""}`}>
              {/* Main data row */}
              <div className="claim-row-main">
                <div className="claim-service">
                  <span className="claim-service-desc">{desc}</span>
                  {code ? (
                    <span className="claim-service-code">CPT {code}</span>
                  ) : null}
                </div>
                <span className="claim-col-num claim-amount">{formatMoney(line.billed)}</span>
                <span className="claim-col-num claim-amount">{formatMoney(line.insurancePaid)}</span>
                <span className="claim-col-num claim-amount">{formatMoney(line.patientResponsibility)}</span>
                <span className="claim-col-status">
                  <span className={badge.cls}>{badge.label}</span>
                </span>
              </div>

              {/* Denial detail row */}
              {denial && denial.appealable ? (
                <div className="claim-denial">
                  <div className="claim-denial-reason">
                    <span className="claim-denial-code">
                      CARC {denial.carc.code}
                    </span>
                    {" — "}
                    {denial.reason}
                  </div>
                  <div className="claim-denial-action">
                    ↳ {denial.recommendedAction || denial.carc.appealNotes || "Review with your insurer."}
                  </div>
                  <div className="claim-appeal-cta">
                    ↳{" "}
                    <strong>APPEAL THIS</strong>
                    {typeof (denial.successRate ?? denial.carc.successRate) === "number" ? (
                      <span className="claim-appeal-rate">
                        {" "}— {Math.round(((denial.successRate ?? denial.carc.successRate) as number) * 100)}% historical success rate
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
