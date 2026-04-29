"use client";

import { useEffect, useRef, useState } from "react";

interface TranscriptLine {
  t: number;
  role: "system" | "agent" | "rep";
  text: string;
}

interface CallState {
  status: string;
  transcripts: TranscriptLine[];
  referenceNumber?: string;
  endedAt?: string;
}

interface CallModalProps {
  callId: string;
  insurerName: string;
  phone: string;
  demoMode: boolean;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  dialing:   "Dialing…",
  ivr:       "Navigating phone menu…",
  on_hold:   "On hold",
  connected: "Connected to representative",
  complete:  "Call complete",
  failed:    "Call failed",
};

const STATUS_COLOR: Record<string, string> = {
  dialing:   "call-status--dialing",
  ivr:       "call-status--dialing",
  on_hold:   "call-status--hold",
  connected: "call-status--connected",
  complete:  "call-status--complete",
  failed:    "call-status--failed",
};

export function CallModal({ callId, insurerName, phone, demoMode, onClose }: CallModalProps) {
  const [state, setState] = useState<CallState>({ status: "dialing", transcripts: [] });
  const [elapsed, setElapsed] = useState(0);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef(Date.now());
  const doneRef = useRef(false);

  // Poll call status every 2 seconds
  useEffect(() => {
    if (doneRef.current) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/call-status?callId=${callId}`);
        if (!res.ok) return;
        const data = (await res.json()) as CallState;
        setState(data);
        if (data.status === "complete" || data.status === "failed") {
          doneRef.current = true;
        }
      } catch {
        // network blip, keep polling
      }
    };

    poll();
    const id = window.setInterval(poll, 2000);
    return () => window.clearInterval(id);
  }, [callId]);

  // Elapsed timer
  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [state.transcripts.length]);

  const isComplete = state.status === "complete";
  const isFailed = state.status === "failed";
  const isDone = isComplete || isFailed;

  function formatElapsed(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal call-modal" role="dialog" aria-modal="true"
        aria-labelledby="call-modal-title">

        {/* Header */}
        <div className="call-modal-header">
          <div>
            <div className="call-modal-insurer">{insurerName}</div>
            <h2 id="call-modal-title" className="call-modal-phone">{phone}</h2>
          </div>
          <div className="call-modal-meta">
            <span className={`call-status ${STATUS_COLOR[state.status] ?? "call-status--dialing"}`}>
              <span className="call-status-dot" aria-hidden />
              {STATUS_LABEL[state.status] ?? state.status}
            </span>
            {!isDone && (
              <span className="call-elapsed">{formatElapsed(elapsed)}</span>
            )}
          </div>
        </div>

        {/* Transcript */}
        <div className="call-transcript" ref={transcriptRef}>
          {state.transcripts.length === 0 && (
            <div className="call-transcript-empty">Connecting…</div>
          )}
          {state.transcripts.map((line, i) => (
            <div key={i} className={`transcript-line transcript-line--${line.role}`}>
              <span className="transcript-role">
                {line.role === "agent" ? "Agent" : line.role === "rep" ? "Rep" : ""}
              </span>
              <span className="transcript-text">{line.text}</span>
            </div>
          ))}
          {!isDone && state.transcripts.length > 0 && (
            <div className="transcript-cursor" aria-hidden>…</div>
          )}
        </div>

        {/* Outcome */}
        {isComplete && state.referenceNumber && (
          <div className="call-outcome">
            <div className="call-outcome-icon" aria-hidden>✓</div>
            <div>
              <div className="call-outcome-title">Appeal filed</div>
              <div className="call-outcome-ref">
                Reference number: <strong>{state.referenceNumber}</strong>
              </div>
              <div className="call-outcome-sub">
                Save this number. You can use it to follow up on your appeal status.
              </div>
            </div>
          </div>
        )}

        {isFailed && (
          <div className="call-outcome call-outcome--failed">
            <div className="call-outcome-icon" aria-hidden>!</div>
            <div>
              <div className="call-outcome-title">Call did not complete</div>
              <div className="call-outcome-sub">
                Use the appeal letter below to submit your appeal by mail or fax.
              </div>
            </div>
          </div>
        )}

        {demoMode && (
          <div className="call-demo-badge">Demo mode — this is a simulated call</div>
        )}

        <div className="call-modal-footer">
          <button
            type="button"
            className={isDone ? "auth-btn-sign" : "auth-btn-cancel"}
            onClick={onClose}
          >
            {isDone ? "Done" : "Cancel call"}
          </button>
        </div>
      </div>
    </div>
  );
}
