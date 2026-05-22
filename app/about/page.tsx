'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useNarrow } from '@/lib/use-narrow';

// Longhand animation props — avoids React's warning about mixing the
// `animation` shorthand with the `animationDelay` longhand.
function fadeIn(delay: string, duration = '0.6s'): React.CSSProperties {
  return {
    animationName:           'fadeSlideUp',
    animationDuration:       duration,
    animationTimingFunction: 'ease-out',
    animationFillMode:       'both',
    animationDelay:          delay,
  };
}

/* ─── Team ─────────────────────────────────────────────────────────────── */
const TEAM = [
  {
    initials: 'AA',
    name:     'Advit Ahuja',
    bg:       'oklch(0.25 0.15 268)',
    links: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/advit-ahuja/' },
      { label: 'GitHub',   href: 'https://github.com/Advittt' },
    ],
  },
  {
    initials: 'JS',
    name:     'Jwalin Shah',
    bg:       'oklch(0.52 0.14 142)',
    links: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jwalin-shah/' },
      { label: 'GitHub',   href: 'https://github.com/jwalin-shah' },
    ],
  },
  {
    initials: 'VW',
    name:     'Victoria Wang',
    bg:       'oklch(0.55 0.18 22)',
    links: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/vicxiawang/' },
      { label: 'GitHub',   href: 'https://github.com/Vikang' },
    ],
  },
];

/* ─── External links ───────────────────────────────────────────────────── */
const LINKS = [
  {
    kicker: 'Watch',
    title:  'The live demo recording',
    sub:    'TrueConsent, presented end to end',
    href:   'https://hel1.your-objectstorage.com/hackersquadcontent/recordings/event_cmnkhwxqi0001qt0k2fhql8xv_cmoksn9m101jenv0k5okmakjb-2026-04-30T011821.mp4',
  },
  {
    kicker: 'Code',
    title:  'TrueConsent on GitHub',
    sub:    'The full source for what you just used',
    href:   'https://github.com/Advittt/TrueConsent',
  },
  {
    kicker: 'Read',
    title:  'The long-form write-up',
    sub:    'How the project came together, with photos',
    href:   'https://advittt.github.io/portfolio/blog-post-2.html',
  },
];

/* ─── Scroll-reveal wrapper ────────────────────────────────────────────── */
function Reveal({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref               = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setShown(true); io.disconnect(); }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity:    shown ? 1 : 0,
        transform:  shown ? 'translateY(0)' : 'translateY(18px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      {children}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
export default function AboutPage() {
  const narrow = useNarrow(820);

  return (
    <div style={S.page}>
      {/* Top bar */}
      <header style={S.topBar}>
        <Link href="/" style={S.logoLink}>
          <div style={S.logoSquare}>TC</div>
          {!narrow && <span style={S.logoText}>TrueConsent</span>}
        </Link>
        <nav style={S.topNav}>
          <Link href="/" style={S.topGhost}>{narrow ? 'Demo' : '← Back to demo'}</Link>
          <Link href="/waitlist" style={S.topCta}>{narrow ? 'Join →' : 'Join waitlist  →'}</Link>
        </nav>
      </header>

      <article style={{ ...S.article, padding: narrow ? '48px 24px 96px' : '80px 48px 120px' }}>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div style={{ ...S.eyebrow, ...fadeIn('0.05s', '0.5s') }}>
          <span style={S.eyebrowMark}>00</span>
          <span style={S.eyebrowDash}>—</span>
          <span>Why we built TrueConsent</span>
        </div>

        <h1 style={{ ...S.headline, ...fadeIn('0.15s'), fontSize: narrow ? 'clamp(34px, 8.5vw, 44px)' : 'clamp(44px, 5.4vw, 64px)' }}>
          Insurance denials are built to<br />make you give up.<br />
          <span style={S.headlineAccent}>We&apos;re building the reason not to.</span>
        </h1>

        <p style={{ ...S.lead, ...fadeIn('0.3s') }}>
          One in five insurance claims gets denied. Most of those denials would collapse if
          someone pushed back — but the process is built to wear you down, so almost nobody
          does. We&apos;re three engineers who kept watching this happen to people around us,
          and built TrueConsent to push back for you.
        </p>

        {/* Hero photo */}
        <figure style={{ ...S.figure, ...fadeIn('0.45s') }}>
          <img src="/about/team-presenting.jpg" alt="The TrueConsent team" style={S.img} loading="lazy" />
          <figcaption style={S.caption}>
            The team behind TrueConsent — Advit&nbsp;Ahuja, Victoria&nbsp;Wang and Jwalin&nbsp;Shah.
          </figcaption>
        </figure>

        {/* ── 01 Where it started ───────────────────────────────────── */}
        <Reveal style={S.section}>
          <ChapterHead n="01" label="Where it started" />
          <p style={S.body}>
            TrueConsent didn&apos;t begin as an appeals tool. Our first build was an AI
            medical-consent-form scanner — something to catch the fine print before you sign
            it. We had nearly finished when we walked the idea through real situations and it
            fell apart: if you need urgent surgery, you are not going to switch hospitals over
            a clause in a form. We&apos;d built something nobody under pressure could use.
          </p>
          <p style={S.body}>
            So we pivoted — with working code already on the table — to the problem people
            actually <em>can</em> act on: the denial that lands <em>after</em> the care, when
            you&apos;re home and the bill doesn&apos;t add up. That decision is the whole
            project. It&apos;s also why we&apos;re still called TrueConsent and not
            TrueAppeals — the name is older than the product.
          </p>
          <p style={S.body}>
            We founded TrueConsent at <strong style={S.strong}>Build YC&apos;s Next Unicorn —
            Agent Hack Day</strong> in San Francisco. Out of
            <strong style={S.strong}> 1,168 registered builders</strong> and 44 projects, a
            panel of <strong style={S.strong}>Y&nbsp;Combinator judges placed it
            second</strong>. The part that stuck with us wasn&apos;t the placement, though —
            it was a room full of people saying <em>&ldquo;I needed this last year.&rdquo;</em>
          </p>
          <div style={S.award}>
            <span style={S.awardIcon}>🏆</span>
            <div>
              <div style={S.awardTitle}>2nd place — Build YC&apos;s Next Unicorn</div>
              <div style={S.awardSub}>
                Founded against a field of <strong style={S.awardHi}>1,168 registered builders</strong> and 44 projects · judged live by a Y&nbsp;Combinator panel
              </div>
            </div>
          </div>
          <figure style={S.figureInline}>
            <img src="/about/top-3-teams.jpg" alt="The TrueConsent team after the results" style={S.img} loading="lazy" />
            <figcaption style={S.caption}>With the other top teams after the results — TrueConsent placed second.</figcaption>
          </figure>
          <PullQuote>Medical appeals are skewed for you to lose. We&apos;re building TrueConsent to flip that.</PullQuote>
        </Reveal>

        {/* ── 02 How it works ───────────────────────────────────────── */}
        <Reveal style={S.section}>
          <ChapterHead n="02" label="How it works" />
          <p style={S.body}>
            TrueConsent reads the paperwork the system counts on you not reading. You drop in
            an Explanation of Benefits, a denial letter, or an itemized hospital bill — and it
            goes to work:
          </p>
          <ul style={S.howList}>
            {[
              'Decodes every medical and denial code into plain English',
              'Cross-references them and flags every wrongful denial, with a case-strength score',
              'Drafts a medically precise, legally grounded appeal letter — with citations',
              'Hands off to an AI agent that calls your insurer to present it, with a live transcript you can watch',
            ].map(item => (
              <li key={item} style={S.howItem}>
                <span style={S.howMark}>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p style={S.body}>
            A dense 60-page bill becomes a complete appeal packet in under 60&nbsp;seconds. And
            the facts are never guessed — every code is checked against official reference
            tables, and the medical-necessity and billing-math checks run on fixed rules. The
            appeal that reaches your insurer is something you can actually stand behind.
          </p>
          <p style={S.bodyMuted}>
            One honest note: the insurer phone call is mocked for this demo. It&apos;s exactly
            where we&apos;re taking the product — but right now, what you see is a walkthrough.
          </p>
        </Reveal>

        {/* ── 03 The team ───────────────────────────────────────────── */}
        <Reveal style={S.section}>
          <ChapterHead n="03" label="The team" />
          <p style={S.body}>
            We&apos;re three engineers from CS backgrounds. No fixed roles — we all did
            everything, because a problem this common deserves people who&apos;ll sweat every
            part of the answer. Medical bills are something all of us deal with; this is our
            attempt to make them fairer.
          </p>
          <div style={{ ...S.teamGrid, gridTemplateColumns: narrow ? '1fr' : 'repeat(3, 1fr)' }}>
            {TEAM.map(m => (
              <div key={m.name} style={S.teamCard}>
                <div style={{ ...S.monogram, background: m.bg }}>{m.initials}</div>
                <div style={S.teamName}>{m.name}</div>
                <div style={S.teamLinks}>
                  {m.links.map(l => (
                    <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={S.teamLink}>
                      {l.label} <span style={S.teamLinkArrow}>↗</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── 04 Links ──────────────────────────────────────────────── */}
        <Reveal style={S.section}>
          <ChapterHead n="04" label="See it for yourself" />
          <div style={{ ...S.linkGrid, gridTemplateColumns: narrow ? '1fr' : '1fr 1fr' }}>
            {LINKS.map(l => (
              <a key={l.title} href={l.href} target="_blank" rel="noopener noreferrer" style={S.linkCard}>
                <span style={S.linkKicker}>{l.kicker}</span>
                <span style={S.linkTitle}>{l.title}</span>
                <span style={S.linkSub}>{l.sub}</span>
                <span style={S.linkArrow}>↗</span>
              </a>
            ))}
          </div>
        </Reveal>

        {/* ── Closing CTA ───────────────────────────────────────────── */}
        <Reveal style={{ ...S.cta, ...(narrow ? { padding: '32px 24px' } : {}) }}>
          <div style={S.ctaInner}>
            <h2 style={S.ctaTitle}>A denial isn&apos;t the final answer.<br /><span style={S.headlineAccent}>See what pushing back looks like.</span></h2>
            <p style={S.ctaSub}>Watch the 25-second demo, then put your own denial in line.</p>
            <div style={{ ...S.ctaBtns, flexDirection: narrow ? 'column' : 'row' }}>
              <Link href="/" style={{ ...S.ctaPrimary, ...(narrow ? { width: '100%' } : {}) }}>Watch the demo</Link>
              <Link href="/waitlist" style={{ ...S.ctaGhost, ...(narrow ? { width: '100%' } : {}) }}>Join the waitlist  →</Link>
            </div>
          </div>
        </Reveal>
      </article>

      <footer style={S.footer}>
        <span>© 2026 TrueConsent, Inc.</span>
        <span style={S.footerDot}>·</span>
        <span>Demo · sample data only</span>
        <span style={S.footerDot}>·</span>
        <span>Not legal advice</span>
      </footer>
    </div>
  );
}

/* ─── Small components ─────────────────────────────────────────────────── */
function ChapterHead({ n, label }: { n: string; label: string }) {
  return (
    <div style={S.chapterHead}>
      <span style={S.chapterN}>{n}</span>
      <span style={S.chapterRule} />
      <span style={S.chapterLabel}>{label}</span>
    </div>
  );
}

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote style={S.quote}>
      <span style={S.quoteMark}>“</span>
      {children}
    </blockquote>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  page:        { minHeight:'100vh', background:'#F8F7F4', display:'flex', flexDirection:'column', fontFamily:"'DM Sans', system-ui, sans-serif" },

  topBar:      { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 24px', maxWidth:1180, margin:'0 auto', width:'100%', position:'sticky', top:0, zIndex:50, background:'#F8F7F4', backdropFilter:'blur(10px)' },
  logoLink:    { display:'flex', alignItems:'center', gap:10, textDecoration:'none' },
  logoSquare:  { width:32, height:32, borderRadius:8, background:'oklch(0.25 0.15 268)', color:'#fff', fontWeight:800, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' },
  logoText:    { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:18, color:'oklch(0.18 0.02 250)' },
  topNav:      { display:'flex', alignItems:'center', gap:10 },
  topGhost:    { fontSize:13, color:'oklch(0.45 0.05 268)', textDecoration:'none', padding:'8px 14px', borderRadius:999, border:'1px solid oklch(0.85 0.02 268)' },
  topCta:      { display:'inline-flex', alignItems:'center', fontSize:13, fontWeight:600, color:'#fff', background:'oklch(0.25 0.15 268)', textDecoration:'none', borderRadius:999, padding:'9px 16px', boxShadow:'0 4px 12px oklch(0.25 0.15 268 / 0.18)' },

  article:     { flex:1, maxWidth:840, margin:'0 auto', width:'100%' },

  eyebrow:     { display:'flex', alignItems:'center', gap:10, marginBottom:28, fontFamily:'"DM Mono", monospace', fontSize:12, letterSpacing:'0.08em', textTransform:'uppercase', color:'oklch(0.55 0.05 268)' },
  eyebrowMark: { color:'oklch(0.25 0.15 268)', fontWeight:600 },
  eyebrowDash: { color:'oklch(0.78 0.04 268)' },

  headline:    { fontFamily:'"DM Serif Display", Georgia, serif', lineHeight:1.1, color:'oklch(0.18 0.02 250)', margin:'0 0 28px', letterSpacing:'-0.025em', fontWeight:400 },
  headlineAccent:{ color:'oklch(0.55 0.18 22)', fontStyle:'italic' },
  lead:        { fontSize:19, lineHeight:1.65, color:'oklch(0.4 0.02 250)', margin:'0 0 40px', maxWidth:680 },
  strong:      { color:'oklch(0.25 0.15 268)', fontWeight:600 },

  figure:      { margin:'0 0 8px', display:'flex', flexDirection:'column', gap:10 },
  figureInline:{ margin:'28px 0 4px', display:'flex', flexDirection:'column', gap:10 },
  img:         { width:'100%', display:'block', borderRadius:16, border:'1px solid oklch(0.91 0.02 268)' },
  caption:     { fontFamily:'"DM Mono", monospace', fontSize:12, lineHeight:1.55, color:'oklch(0.55 0.05 268)', textAlign:'center', maxWidth:560, margin:'0 auto' },

  section:     { marginTop:64 },
  chapterHead: { display:'flex', alignItems:'center', gap:14, marginBottom:24 },
  chapterN:    { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:30, color:'oklch(0.55 0.18 22)', lineHeight:1 },
  chapterRule: { width:32, height:1, background:'oklch(0.8 0.04 268)', flexShrink:0 },
  chapterLabel:{ fontFamily:'"DM Mono", monospace', fontSize:13, letterSpacing:'0.08em', textTransform:'uppercase', color:'oklch(0.3 0.08 268)', fontWeight:500 },

  body:        { fontSize:17, lineHeight:1.72, color:'oklch(0.34 0.02 250)', margin:'0 0 18px', maxWidth:680 },
  bodyMuted:   { fontSize:14.5, lineHeight:1.65, color:'oklch(0.55 0.05 268)', margin:'18px 0 0', maxWidth:680, fontStyle:'italic' },

  howList:     { listStyle:'none', padding:0, margin:'4px 0 22px', display:'flex', flexDirection:'column', gap:13, maxWidth:680 },
  howItem:     { display:'flex', alignItems:'flex-start', gap:12, fontSize:16, lineHeight:1.55, color:'oklch(0.34 0.02 250)' },
  howMark:     { flexShrink:0, width:20, height:20, borderRadius:6, background:'oklch(0.52 0.14 142 / 0.13)', color:'oklch(0.42 0.12 142)', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', marginTop:1 },

  quote:       { margin:'30px 0 4px', padding:'4px 0 4px 26px', borderLeft:'3px solid oklch(0.55 0.18 22)', fontFamily:'"DM Serif Display", Georgia, serif', fontSize:24, lineHeight:1.4, color:'oklch(0.22 0.04 268)', fontStyle:'italic' },
  quoteMark:   { color:'oklch(0.55 0.18 22)', marginRight:2 },

  award:       { display:'flex', alignItems:'center', gap:14, background:'oklch(0.97 0.035 55)', border:'1px solid oklch(0.84 0.1 55)', borderRadius:14, padding:'16px 18px', margin:'22px 0 4px', maxWidth:680 },
  awardIcon:   { fontSize:26, lineHeight:1, flexShrink:0 },
  awardTitle:  { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:18, color:'oklch(0.34 0.1 55)', marginBottom:3 },
  awardSub:    { fontFamily:'"DM Mono", monospace', fontSize:11.5, lineHeight:1.55, color:'oklch(0.52 0.07 55)', letterSpacing:'0.01em' },
  awardHi:     { color:'oklch(0.42 0.16 55)', fontWeight:700 },

  teamGrid:    { display:'grid', gap:16, marginTop:26 },
  teamCard:    { background:'#fff', border:'1px solid oklch(0.91 0.02 268)', borderRadius:16, padding:'24px 22px', display:'flex', flexDirection:'column', alignItems:'flex-start' },
  monogram:    { width:48, height:48, borderRadius:12, color:'#fff', fontFamily:'"DM Serif Display", Georgia, serif', fontSize:19, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 },
  teamName:    { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:21, color:'oklch(0.18 0.02 250)', marginBottom:16 },
  teamLinks:   { display:'flex', gap:8, flexWrap:'wrap', marginTop:'auto' },
  teamLink:    { fontSize:13, fontWeight:600, color:'oklch(0.25 0.15 268)', textDecoration:'none', background:'oklch(0.25 0.15 268 / 0.07)', border:'1px solid oklch(0.25 0.15 268 / 0.14)', borderRadius:999, padding:'6px 12px' },
  teamLinkArrow:{ fontSize:11, opacity:0.7 },

  linkGrid:    { display:'grid', gap:14, marginTop:26 },
  linkCard:    { position:'relative', display:'flex', flexDirection:'column', gap:5, background:'#fff', border:'1px solid oklch(0.91 0.02 268)', borderRadius:14, padding:'20px 22px', textDecoration:'none' },
  linkKicker:  { fontFamily:'"DM Mono", monospace', fontSize:10.5, letterSpacing:'0.1em', textTransform:'uppercase', color:'oklch(0.55 0.18 22)', fontWeight:500 },
  linkTitle:   { fontSize:16, fontWeight:700, color:'oklch(0.2 0.03 268)', letterSpacing:'-0.01em', paddingRight:24 },
  linkSub:     { fontSize:13.5, color:'oklch(0.52 0.05 268)', lineHeight:1.5 },
  linkArrow:   { position:'absolute', top:18, right:20, fontSize:15, color:'oklch(0.6 0.05 268)' },

  cta:         { marginTop:72, background:'oklch(0.25 0.15 268)', borderRadius:24, padding:'52px 40px', textAlign:'center', boxShadow:'0 30px 70px oklch(0.25 0.15 268 / 0.22)' },
  ctaInner:    { maxWidth:540, margin:'0 auto' },
  ctaTitle:    { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:'clamp(26px, 3.8vw, 36px)', lineHeight:1.18, color:'#fff', margin:'0 0 14px', fontWeight:400, letterSpacing:'-0.02em' },
  ctaSub:      { fontSize:16, color:'oklch(0.85 0.06 268)', lineHeight:1.6, margin:'0 0 28px' },
  ctaBtns:     { display:'flex', gap:12, justifyContent:'center' },
  ctaPrimary:  { display:'inline-flex', alignItems:'center', justifyContent:'center', background:'#fff', color:'oklch(0.25 0.15 268)', fontSize:15, fontWeight:700, textDecoration:'none', borderRadius:12, padding:'14px 26px' },
  ctaGhost:    { display:'inline-flex', alignItems:'center', justifyContent:'center', background:'transparent', color:'#fff', fontSize:15, fontWeight:600, textDecoration:'none', borderRadius:12, padding:'14px 26px', border:'1px solid oklch(0.7 0.08 268)' },

  footer:      { display:'flex', justifyContent:'center', flexWrap:'wrap', gap:10, padding:'28px 24px 36px', fontSize:13, color:'oklch(0.6 0.03 268)' },
  footerDot:   { color:'oklch(0.78 0.04 268)' },
};
