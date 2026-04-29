"use client";

import { useState } from "react";
import type { DecodedClaim } from "@/lib/types/claim";

interface AuthModalProps {
  claim: DecodedClaim;
  onAuthorize: (signedAt: string) => void;
  onCancel: () => void;
}

export function AuthModal({ claim, onAuthorize, onCancel }: AuthModalProps) {
  const [name, setName] = useState(claim.patientName ?? "");
  const [agreed, setAgreed] = useState(false);
  const today = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !agreed) return;
    onAuthorize(new Date().toISOString());
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog"
        aria-modal="true" aria-labelledby="auth-modal-title">

        <div className="modal-header">
          <h2 id="auth-modal-title" className="modal-title">
            Authorize TrueConsent to call on your behalf
          </h2>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="Cancel">×</button>
        </div>

        <div className="modal-body">
          <div className="auth-doc">
            <div className="auth-doc-label">Representative Authorization</div>
            <p>
              I authorize <strong>TrueConsent</strong> to contact{" "}
              <strong>{claim.insurerName ?? "my insurance company"}</strong> by phone on
              my behalf regarding claim <strong>#{claim.claimId ?? "on file"}</strong>{" "}
              dated <strong>{claim.serviceDate ?? "on file"}</strong>.
            </p>
            <p>
              This authorization is for the sole purpose of filing a Level 1 internal
              appeal for denied claim(s) on this EOB. It does not authorize TrueConsent
              to make any financial decisions, access other claims, or act as a legal
              representative. This authorization is valid for <strong>90 days</strong> from
              the date signed below.
            </p>
            <p className="auth-small">
              Under ERISA §503 and applicable ACA provisions, you have the right to file a
              Level 1 internal appeal for any denied claim. TrueConsent facilitates this
              administrative process on your behalf with your explicit authorization.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-row">
              <label htmlFor="auth-name" className="auth-label">
                Type your full name to sign
              </label>
              <input
                id="auth-name"
                type="text"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={claim.patientName ?? "Your full name"}
                autoComplete="name"
                autoFocus
              />
            </div>

            <div className="auth-date">Date: {today}</div>

            <label className="auth-checkbox-row">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                I have read and agree to the authorization above. I understand TrueConsent
                will call my insurance company on my behalf to file this appeal.
              </span>
            </label>

            <div className="auth-actions">
              <button type="button" className="auth-btn-cancel" onClick={onCancel}>
                Cancel
              </button>
              <button
                type="submit"
                className="auth-btn-sign"
                disabled={!name.trim() || !agreed}
              >
                Sign &amp; authorize call
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
