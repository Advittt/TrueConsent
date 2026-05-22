'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useNarrow } from '@/lib/use-narrow';

// Formspree form endpoint — submissions appear in the Formspree dashboard.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mvzyrbqj';

// Longhand animation props. Avoids mixing the `animation` shorthand with the
// `animationDelay` longhand — React warns about that when conditional branches
// render the same element with and without the delay.
function fadeIn(delay: string, duration = '0.6s'): React.CSSProperties {
  return {
    animationName:           'fadeSlideUp',
    animationDuration:       duration,
    animationTimingFunction: 'ease-out',
    animationFillMode:       'both',
    animationDelay:          delay,
  };
}

export default function WaitlistPage() {
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [situation,  setSituation]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState('');
  const narrow                      = useNarrow(820);

  const validEmail = /.+@.+\..+/.test(email.trim());
  const validName  = name.trim().length > 0;
  const canSubmit  = validName && validEmail && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name:      name.trim(),
          email:     email.trim(),
          situation: situation.trim(),
          _subject:  `TrueConsent waitlist — ${name.trim()}`,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => null);
        const msg  = data?.errors?.map((x: { message: string }) => x.message).join(', ');
        setError(msg || 'Something went wrong on our end. Please try again.');
      }
    } catch {
      setError('Couldn’t reach the server — check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const filled = [name, email, situation].filter(s => s.trim().length > 0).length;
  const firstName = name.trim().split(/\s+/)[0] || 'friend';

  return (
    <div style={S.page}>
      <header style={S.topBar}>
        <Link href="/" style={S.logoLink}>
          <div style={S.logoSquare}>TC</div>
          <span style={S.logoText}>TrueConsent</span>
        </Link>
        <Link href="/" style={S.topBack}>{narrow ? '← Demo' : '← Back to demo'}</Link>
      </header>

      <main style={{ ...S.main, gridTemplateColumns: narrow ? '1fr' : 'minmax(0, 1.05fr) minmax(0, 1fr)', gap: narrow ? 40 : 96, padding: narrow ? '40px 24px 80px' : '64px 48px 120px' }}>

        {/* LEFT — editorial */}
        <section style={S.left}>
          <div style={{ ...S.eyebrow, ...fadeIn('0.05s', '0.5s') }}>
            <span style={S.eyebrowMark}>01</span>
            <span style={S.eyebrowDash}>—</span>
            <span>{submitted ? 'You\'re in' : 'Join the list'}</span>
          </div>

          {!submitted ? (
            <>
              <h1 style={{ ...S.headline, ...fadeIn('0.15s') }}>
                We&apos;re letting people in,<br />
                <span style={S.headlineAccent}>one denial at a time.</span>
              </h1>
              <p style={{ ...S.lead, ...fadeIn('0.3s') }}>
                TrueConsent isn&apos;t open to the public yet. Every week we take on a small number of real denials from the waitlist and run them end-to-end — the same way you just watched Sarah recover&nbsp;$3,847.
              </p>
              <p style={{ ...S.lead, ...fadeIn('0.4s') }}>
                If you&apos;re sitting on a denial — or know someone who is — leave your details. We&apos;ll reach out the moment a slot opens.
              </p>
              <ul style={{ ...S.bullets, ...fadeIn('0.5s') }}>
                {[
                  'Patients with active denials get priority',
                  'No credit card. No commitment.',
                  'One email when you’re in — nothing else.',
                ].map(b => (
                  <li key={b} style={S.bullet}>
                    <span style={S.bulletMark}>→</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h1 style={{ ...S.headline, ...fadeIn('0s') }}>
                You&apos;re on the list,<br />
                <span style={S.headlineAccent}>{firstName}.</span>
              </h1>
              <p style={{ ...S.lead, ...fadeIn('0.15s') }}>
                We logged your details for <strong style={S.strong}>{email.trim()}</strong>. When a slot opens that fits your situation, you&apos;ll be first to hear.
              </p>
              <p style={{ ...S.lead, ...fadeIn('0.3s') }}>
                In the meantime — share the demo with one person who&apos;s been screwed by an insurer. It takes 25&nbsp;seconds and it might change their mind about appealing.
              </p>
            </>
          )}

          <Link href="/" style={{ ...S.backLink, ...fadeIn('0.6s') }}>
            <span style={S.backArrow}>←</span>
            <span>Back to the demo</span>
          </Link>
        </section>

        {/* RIGHT — form card */}
        <section style={S.right}>
          <form
            onSubmit={handleSubmit}
            style={{
              ...S.card,
              ...fadeIn('0.25s'),
              transition: 'all 0.4s ease',
              transform: submitted ? 'scale(0.985)' : 'none',
            }}
          >
            <div style={S.cardEyebrow}>
              <span style={S.cardEyebrowText}>{submitted ? '✓ Submitted' : 'We need three things'}</span>
              <span style={S.cardCount}>
                <strong style={S.cardCountN}>{submitted ? 3 : filled}</strong>
                <span style={S.cardCountSlash}>/3</span>
              </span>
            </div>

            <Field
              index={1}
              label="Your name"
              type="text"
              value={name}
              onChange={setName}
              disabled={submitted}
              autoFocus
            />
            <Field
              index={2}
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              disabled={submitted}
            />
            <FieldArea
              index={3}
              label="Your situation"
              hint="optional"
              placeholder="Patient? Doctor? Advocate? What denial are you sitting on?"
              value={situation}
              onChange={setSituation}
              disabled={submitted}
            />

            {error && !submitted && (
              <div style={S.errorBox} role="alert">
                <span style={S.errorMark}>!</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit && !submitted}
              style={{
                ...S.submit,
                ...(submitted ? S.submitDone : {}),
                opacity: submitted ? 1 : !canSubmit ? 0.55 : 1,
                cursor: submitted || !canSubmit ? 'default' : 'pointer',
              }}
            >
              {submitted
                ? '✓  You’re on the list'
                : submitting
                  ? 'Adding you…'
                  : 'Add me to the list  →'}
            </button>

            <p style={S.fineprint}>
              We&apos;ll never share your email. One-click unsubscribe.
            </p>
          </form>
        </section>
      </main>

      <footer style={S.footer}>
        <span>© 2026 TrueConsent, Inc.</span>
        <span style={S.footerDot}>·</span>
        <span>HIPAA Compliant</span>
        <span style={S.footerDot}>·</span>
        <span>Not legal advice</span>
      </footer>
    </div>
  );
}

interface FieldProps {
  index:        number;
  label:        string;
  value:        string;
  onChange:     (v: string) => void;
  type?:        string;
  placeholder?: string;
  disabled?:    boolean;
  autoFocus?:   boolean;
  hint?:        string;
}

function Field({ index, label, value, onChange, type='text', placeholder, disabled, autoFocus, hint }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <label style={F.wrap}>
      <span style={F.labelRow}>
        <span style={F.idx}>{String(index).padStart(2, '0')}</span>
        <span style={{ ...F.label, color: active ? 'oklch(0.25 0.15 268)' : 'oklch(0.55 0.05 268)' }}>{label}</span>
        {hint && <span style={F.hint}>{hint}</span>}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={e => onChange(e.target.value)}
        style={{
          ...F.input,
          borderBottomColor: focused ? 'oklch(0.25 0.15 268)' : value.length > 0 ? 'oklch(0.55 0.05 268)' : 'oklch(0.85 0.02 268)',
          borderBottomWidth: focused ? 2 : 1,
          color: disabled ? 'oklch(0.45 0.05 268)' : 'oklch(0.18 0.02 250)',
        }}
      />
    </label>
  );
}

function FieldArea({ index, label, value, onChange, placeholder, disabled, hint }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <label style={F.wrap}>
      <span style={F.labelRow}>
        <span style={F.idx}>{String(index).padStart(2, '0')}</span>
        <span style={{ ...F.label, color: active ? 'oklch(0.25 0.15 268)' : 'oklch(0.55 0.05 268)' }}>{label}</span>
        {hint && <span style={F.hint}>{hint}</span>}
      </span>
      <textarea
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={e => onChange(e.target.value)}
        style={{
          ...F.input,
          ...F.area,
          borderBottomColor: focused ? 'oklch(0.25 0.15 268)' : value.length > 0 ? 'oklch(0.55 0.05 268)' : 'oklch(0.85 0.02 268)',
          borderBottomWidth: focused ? 2 : 1,
          color: disabled ? 'oklch(0.45 0.05 268)' : 'oklch(0.18 0.02 250)',
        }}
      />
    </label>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:           { minHeight:'100vh', background:'#F8F7F4', display:'flex', flexDirection:'column', fontFamily:"'DM Sans', system-ui, sans-serif" },
  topBar:         { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', maxWidth:1280, margin:'0 auto', width:'100%' },
  logoLink:       { display:'flex', alignItems:'center', gap:10, textDecoration:'none' },
  logoSquare:     { width:32, height:32, borderRadius:8, background:'oklch(0.25 0.15 268)', color:'#fff', fontWeight:800, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' },
  logoText:       { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:18, color:'oklch(0.18 0.02 250)' },
  topBack:        { fontSize:13, color:'oklch(0.45 0.05 268)', textDecoration:'none', padding:'8px 14px', borderRadius:999, border:'1px solid oklch(0.85 0.02 268)', background:'transparent', transition:'all 0.15s' },

  main:           { flex:1, display:'grid', maxWidth:1180, margin:'0 auto', width:'100%', alignItems:'center' },

  left:           { display:'flex', flexDirection:'column' },
  eyebrow:        { display:'flex', alignItems:'center', gap:10, marginBottom:32, fontFamily:'"DM Mono", monospace', fontSize:12, letterSpacing:'0.08em', textTransform:'uppercase', color:'oklch(0.55 0.05 268)' },
  eyebrowMark:    { color:'oklch(0.25 0.15 268)', fontWeight:600 },
  eyebrowDash:    { color:'oklch(0.78 0.04 268)' },

  headline:       { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:'clamp(40px, 5.5vw, 64px)', lineHeight:1.05, color:'oklch(0.18 0.02 250)', margin:'0 0 32px', letterSpacing:'-0.025em', fontWeight:400 },
  headlineAccent: { color:'oklch(0.55 0.18 22)', fontStyle:'italic' },
  lead:           { fontSize:17, lineHeight:1.65, color:'oklch(0.4 0.02 250)', margin:'0 0 18px', maxWidth:520 },
  strong:         { color:'oklch(0.25 0.15 268)', fontWeight:600 },

  bullets:        { listStyle:'none', padding:0, margin:'24px 0 0', display:'flex', flexDirection:'column', gap:12, maxWidth:520 },
  bullet:         { display:'flex', alignItems:'flex-start', gap:12, fontSize:15, color:'oklch(0.35 0.02 250)' },
  bulletMark:     { color:'oklch(0.55 0.18 22)', fontWeight:700, flexShrink:0, marginTop:1 },

  backLink:       { display:'inline-flex', alignItems:'center', gap:6, marginTop:48, fontSize:14, fontWeight:500, color:'oklch(0.45 0.05 268)', textDecoration:'none', padding:'8px 0', alignSelf:'flex-start', transition:'color 0.15s' },
  backArrow:      { fontSize:14, transition:'transform 0.15s' },

  right:          { display:'flex', justifyContent:'center', width:'100%' },
  card:           { background:'#fff', border:'1px solid oklch(0.91 0.02 268)', borderRadius:20, padding:'36px 36px 28px', width:'100%', maxWidth:460, boxShadow:'0 30px 80px oklch(0.25 0.15 268 / 0.06), 0 4px 12px oklch(0.25 0.15 268 / 0.04)' },
  cardEyebrow:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, paddingBottom:16, borderBottom:'1px solid oklch(0.93 0.02 268)' },
  cardEyebrowText:{ fontFamily:'"DM Mono", monospace', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', color:'oklch(0.55 0.05 268)' },
  cardCount:      { fontFamily:'"DM Mono", monospace', fontSize:13, color:'oklch(0.55 0.05 268)' },
  cardCountN:     { color:'oklch(0.25 0.15 268)', fontWeight:700, fontSize:15 },
  cardCountSlash: { color:'oklch(0.78 0.04 268)' },

  submit:         { background:'oklch(0.25 0.15 268)', color:'#fff', border:'none', borderRadius:12, padding:'16px 20px', fontSize:15, fontWeight:700, marginTop:8, width:'100%', transition:'all 0.15s ease', boxShadow:'0 8px 20px oklch(0.25 0.15 268 / 0.20)', letterSpacing:'-0.005em' },
  submitDone:     { background:'oklch(0.52 0.14 142)', boxShadow:'0 8px 20px oklch(0.52 0.14 142 / 0.25)' },

  errorBox:       { display:'flex', alignItems:'flex-start', gap:8, background:'oklch(0.97 0.03 22)', border:'1px solid oklch(0.86 0.09 22)', borderRadius:10, padding:'10px 13px', fontSize:13, lineHeight:1.45, color:'oklch(0.5 0.18 22)', marginBottom:14 },
  errorMark:      { flexShrink:0, width:16, height:16, borderRadius:999, background:'oklch(0.55 0.18 22)', color:'#fff', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', marginTop:1 },

  fineprint:      { fontSize:12, color:'oklch(0.55 0.05 268)', textAlign:'center', marginTop:14, marginBottom:0, lineHeight:1.5 },

  footer:         { display:'flex', justifyContent:'center', gap:10, padding:'24px 24px 32px', fontSize:13, color:'oklch(0.6 0.03 268)' },
  footerDot:      { color:'oklch(0.78 0.04 268)' },
};

const F: Record<string, React.CSSProperties> = {
  wrap:     { display:'flex', flexDirection:'column', gap:6, marginBottom:22 },
  labelRow: { display:'flex', alignItems:'baseline', gap:8 },
  idx:      { fontFamily:'"DM Mono", monospace', fontSize:10, color:'oklch(0.65 0.05 268)', fontWeight:500 },
  label:    { fontSize:13, fontWeight:600, letterSpacing:'-0.005em', transition:'color 0.2s' },
  hint:     { fontSize:11, color:'oklch(0.65 0.05 268)', marginLeft:'auto', fontStyle:'italic' },
  input:    { border:'none', borderBottom:'1px solid oklch(0.85 0.02 268)', background:'transparent', padding:'10px 0 8px', fontSize:16, fontFamily:'inherit', outline:'none', transition:'border-color 0.2s, border-width 0.2s', borderRadius:0, width:'100%' },
  area:     { resize:'vertical', minHeight:64, lineHeight:1.5 },
};
