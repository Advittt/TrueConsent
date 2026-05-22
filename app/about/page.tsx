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
    ],
  },
  {
    initials: 'VW',
    name:     'Victoria Wang',
    bg:       'oklch(0.55 0.18 22)',
    links: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/vicxiawang/' },
    ],
  },
];

/* ─── External links ───────────────────────────────────────────────────── */
const LINKS = [
  {
    kicker: 'Watch',
    title:  'The live demo recording',
    sub:    'TrueConsent presented to the room and the YC panel',
    href:   'https://hel1.your-objectstorage.com/hackersquadcontent/recordings/event_cmnkhwxqi0001qt0k2fhql8xv_cmoksn9m101jenv0k5okmakjb-2026-04-30T011821.mp4',
  },
  {
    kicker: 'Event',
    title:  'Build YC’s Next Unicorn — Agent Hack Day',
    sub:    'The hackathon page on HackerSquad',
    href:   'https://hackersquad.io/events/build-ycs-next-unicorn-agent-hack-day',
  },
  {
    kicker: 'Code',
    title:  'TrueConsent on GitHub',
    sub:    'The full source for what you just used',
    href:   'https://github.com/Advittt/TrueConsent',
  },
  {
    kicker: 'Read',
    title:  'How we built it in a single day',
    sub:    'The long-form write-up, with photos',
    href:   'https://advittt.github.io/portfolio/blog-post-2.html',
  },
];

/* ─── Scroll-reveal wrapper ────────────────────────────────────────────── */
function Reveal({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref            = useRef<HTMLDivElement>(null);
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
          <span>The story behind TrueConsent</span>
        </div>

        <h1 style={{ ...S.headline, ...fadeIn('0.15s'), fontSize: narrow ? 'clamp(36px, 9vw, 46px)' : 'clamp(46px, 5.6vw, 68px)' }}>
          We built this in a day.<br />
          <span style={S.headlineAccent}>YC’s judges placed us second.</span>
        </h1>

        <p style={{ ...S.lead, ...fadeIn('0.3s') }}>
          TrueConsent was built at <strong style={S.strong}>Build YC’s Next Unicorn — Agent
          Hack&nbsp;Day</strong>: one room on Market Street in San Francisco, a panel of
          Y&nbsp;Combinator judges, and a single day to go from idea to a live demo on stage.
          We walked out with <strong style={S.strong}>2nd place</strong> and the
          <strong style={S.strong}> Best Use of Lightsprint</strong> prize.
        </p>

        {/* Stat strip */}
        <div style={{ ...S.statStrip, ...fadeIn('0.42s'), gridTemplateColumns: narrow ? '1fr 1fr' : 'repeat(4, 1fr)' }}>
          {[
            { n: '1,168', l: 'builders in the room' },
            { n: '44',    l: 'projects submitted' },
            { n: '2nd',   l: 'place — judged by YC' },
            { n: '1 day', l: 'idea to live demo' },
          ].map(({ n, l }) => (
            <div key={l} style={S.stat}>
              <div style={S.statN}>{n}</div>
              <div style={S.statL}>{l}</div>
            </div>
          ))}
        </div>

        {/* Hero photo */}
        <figure style={{ ...S.figure, ...fadeIn('0.55s') }}>
          <img src="/about/team-presenting.jpg" alt="The TrueConsent team presenting on stage" style={S.img} loading="lazy" />
          <figcaption style={S.caption}>
            Presenting TrueConsent live to the room and the YC&nbsp;panel — Advit&nbsp;Ahuja,
            Victoria&nbsp;Wang, and Jwalin&nbsp;Shah on the mic.
          </figcaption>
        </figure>

        {/* ── 01 The hackathon ──────────────────────────────────────── */}
        <Reveal style={S.section}>
          <ChapterHead n="01" label="The hackathon" />
          <p style={S.body}>
            Build YC’s Next Unicorn — Agent Hack Day ran out of the AWS Builder Loft: a full
            day, idea to working product, demoed live in front of a panel of YC judges. Before
            anyone wrote a line of code, <strong style={S.strong}>Kuanze&nbsp;Ma</strong> — who
            had won two hackathons in two days — laid out the four things judges actually look
            for.
          </p>
          <div style={{ ...S.pillRow, gridTemplateColumns: narrow ? '1fr 1fr' : 'repeat(4, 1fr)' }}>
            {['Usefulness', 'Execution', 'Leverage', 'Clarity'].map((p, i) => (
              <div key={p} style={S.pill}>
                <span style={S.pillN}>{String(i + 1).padStart(2, '0')}</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
          <PullQuote>Solve one problem — and make it realistic to finish in the time you have.</PullQuote>
        </Reveal>

        {/* ── 02 The pivot ──────────────────────────────────────────── */}
        <Reveal style={S.section}>
          <ChapterHead n="02" label="The pivot" />
          <p style={S.body}>
            Here’s the question we still get asked: why is the team named
            <strong style={S.strong}> TrueConsent</strong>, not TrueAppeals? Because we didn’t
            start here. Our first build was an AI <em>medical-consent-form scanner</em> —
            something that flags the red lines before you sign them.
          </p>
          <p style={S.body}>
            We had nearly finished it when we talked it through with the YC panelists, and they
            walked us straight into the flaw: if you need urgent surgery, you are not going to
            change hospitals over a clause in a form. The product solved a problem nobody under
            pressure could act on.
          </p>
          <p style={S.body}>
            So we pivoted — mid-build, with working code on the table — to the thing people
            <em> can</em> act on: the denial that arrives <em>after</em> the care. That decision,
            more than any feature, is what won us the placement.
          </p>
          <PullQuote>Knowing when to throw away working code is its own skill.</PullQuote>
        </Reveal>

        {/* ── 03 What we built ──────────────────────────────────────── */}
        <Reveal style={S.section}>
          <ChapterHead n="03" label="What we built" />
          <p style={S.body}>
            TrueConsent is an arbitrage on inattention. Insurers deny claims at scale; most of
            those denials collapse the moment someone pushes back — and almost nobody pushes
            back. So we built the thing that pushes back for you.
          </p>
          <p style={S.body}>
            Drop in an Explanation of Benefits, a denial letter, or an itemized bill. Every
            CPT, ICD-10, CARC and RARC code is looked up in local CMS reference tables — no
            inference, no hallucinated facts. A rule engine runs the medical-necessity and
            billing-math checks on its own. Only once the facts are grounded does Claude step
            in to draft a citation-backed appeal. A dense 60-page bill becomes a complete
            appeal packet in <strong style={S.strong}>under 60 seconds</strong>.
          </p>
          <p style={S.body}>
            We built it on Next.js&nbsp;15, React&nbsp;19, TypeScript and Tailwind, with Claude
            reached through TokenRouter — all inside <strong style={S.strong}>Lightsprint</strong>,
            an agentic IDE and one of the hackathon sponsors. Leaning on that leverage is what
            let us ship more than one project that day, and it earned us the
            <strong style={S.strong}> Best Use of Lightsprint</strong> prize.
          </p>
          <figure style={S.figureInline}>
            <img src="/about/advit-speaking.jpg" alt="Presenting TrueConsent at the podium" style={S.img} loading="lazy" />
            <figcaption style={S.caption}>Twenty-five seconds, on stage: an Explanation of Benefits to a filed appeal.</figcaption>
          </figure>
        </Reveal>

        {/* ── 04 The podium ─────────────────────────────────────────── */}
        <Reveal style={S.section}>
          <ChapterHead n="04" label="The podium" />
          <p style={S.body}>
            Second out of 44. What stayed with us wasn’t the trophy — it was the rest of the
            podium. All three winning projects were built around care and accessibility. That
            tells you something about where the next big company gets built.
          </p>
          <figure style={S.figureInline}>
            <img src="/about/top-3-teams.jpg" alt="The top three teams at the awards" style={S.img} loading="lazy" />
            <figcaption style={S.caption}>
              The top three — Jwalin, Advit and Victoria (TrueConsent, 2nd); Holly&nbsp;Tang
              (ScanReason&nbsp;AI, 1st); Alison&nbsp;Cossette (Ruby’s&nbsp;Agent, 3rd).
            </figcaption>
          </figure>
          <figure style={S.figureInline}>
            <img src="/about/awards.png" alt="The hackathon prize results" style={S.img} loading="lazy" />
            <figcaption style={S.caption}>The results — TrueConsent took 2nd Place Demo and Best Use of Lightsprint.</figcaption>
          </figure>
          <PullQuote>Medical appeals are skewed for you to lose. We’re building TrueConsent to flip that.</PullQuote>
        </Reveal>

        {/* ── The team ──────────────────────────────────────────────── */}
        <Reveal style={S.section}>
          <ChapterHead n="05" label="The team" />
          <p style={S.body}>
            Three builders from CS backgrounds, one weekend, one room of 1,168. No fixed
            roles — we all did everything: picking up brand-new tools and shipping a working
            MVP in hours, not weeks.
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
          <p style={{ ...S.thanks }}>
            With thanks to <strong style={S.strong}>HackerSquad</strong> and Adam&nbsp;Chan for
            running it, to hosts Sam&nbsp;Hooti and Kuanze&nbsp;Ma, and to sponsors
            Lightsprint, TokenRouter and AWS for the tools and the room.
          </p>
        </Reveal>

        {/* ── Links ─────────────────────────────────────────────────── */}
        <Reveal style={S.section}>
          <ChapterHead n="06" label="See it for yourself" />
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
            <h2 style={S.ctaTitle}>They believed in our idea.<br /><span style={S.headlineAccent}>So do we.</span></h2>
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

  headline:    { fontFamily:'"DM Serif Display", Georgia, serif', lineHeight:1.06, color:'oklch(0.18 0.02 250)', margin:'0 0 28px', letterSpacing:'-0.025em', fontWeight:400 },
  headlineAccent:{ color:'oklch(0.55 0.18 22)', fontStyle:'italic' },
  lead:        { fontSize:19, lineHeight:1.65, color:'oklch(0.4 0.02 250)', margin:'0 0 36px', maxWidth:680 },
  strong:      { color:'oklch(0.25 0.15 268)', fontWeight:600 },

  statStrip:   { display:'grid', gap:1, background:'oklch(0.91 0.02 268)', border:'1px solid oklch(0.91 0.02 268)', borderRadius:16, overflow:'hidden', marginBottom:44 },
  stat:        { background:'#fff', padding:'22px 18px', textAlign:'center' },
  statN:       { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:34, color:'oklch(0.25 0.15 268)', lineHeight:1, marginBottom:6 },
  statL:       { fontSize:12.5, color:'oklch(0.5 0.05 268)', lineHeight:1.4 },

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

  pillRow:     { display:'grid', gap:10, margin:'24px 0 4px' },
  pill:        { display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1px solid oklch(0.91 0.02 268)', borderRadius:10, padding:'12px 14px', fontSize:14, fontWeight:600, color:'oklch(0.25 0.15 268)' },
  pillN:       { fontFamily:'"DM Mono", monospace', fontSize:11, color:'oklch(0.7 0.05 268)', fontWeight:500 },

  quote:       { margin:'30px 0 4px', padding:'4px 0 4px 26px', borderLeft:'3px solid oklch(0.55 0.18 22)', fontFamily:'"DM Serif Display", Georgia, serif', fontSize:24, lineHeight:1.4, color:'oklch(0.22 0.04 268)', fontStyle:'italic', position:'relative' },
  quoteMark:   { color:'oklch(0.55 0.18 22)', marginRight:2 },

  teamGrid:    { display:'grid', gap:16, marginTop:26 },
  teamCard:    { background:'#fff', border:'1px solid oklch(0.91 0.02 268)', borderRadius:16, padding:'24px 22px', display:'flex', flexDirection:'column', alignItems:'flex-start' },
  monogram:    { width:48, height:48, borderRadius:12, color:'#fff', fontFamily:'"DM Serif Display", Georgia, serif', fontSize:19, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 },
  teamName:    { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:21, color:'oklch(0.18 0.02 250)', marginBottom:16 },
  teamLinks:   { display:'flex', gap:8, flexWrap:'wrap', marginTop:'auto' },
  teamLink:    { fontSize:13, fontWeight:600, color:'oklch(0.25 0.15 268)', textDecoration:'none', background:'oklch(0.25 0.15 268 / 0.07)', border:'1px solid oklch(0.25 0.15 268 / 0.14)', borderRadius:999, padding:'6px 12px' },
  teamLinkArrow:{ fontSize:11, opacity:0.7 },

  thanks:      { fontSize:14.5, lineHeight:1.65, color:'oklch(0.5 0.05 268)', margin:'28px 0 0', maxWidth:680 },

  linkGrid:    { display:'grid', gap:14, marginTop:26 },
  linkCard:    { position:'relative', display:'flex', flexDirection:'column', gap:5, background:'#fff', border:'1px solid oklch(0.91 0.02 268)', borderRadius:14, padding:'20px 22px', textDecoration:'none' },
  linkKicker:  { fontFamily:'"DM Mono", monospace', fontSize:10.5, letterSpacing:'0.1em', textTransform:'uppercase', color:'oklch(0.55 0.18 22)', fontWeight:500 },
  linkTitle:   { fontSize:16, fontWeight:700, color:'oklch(0.2 0.03 268)', letterSpacing:'-0.01em', paddingRight:24 },
  linkSub:     { fontSize:13.5, color:'oklch(0.52 0.05 268)', lineHeight:1.5 },
  linkArrow:   { position:'absolute', top:18, right:20, fontSize:15, color:'oklch(0.6 0.05 268)' },

  cta:         { marginTop:72, background:'oklch(0.25 0.15 268)', borderRadius:24, padding:'52px 40px', textAlign:'center', boxShadow:'0 30px 70px oklch(0.25 0.15 268 / 0.22)' },
  ctaInner:    { maxWidth:520, margin:'0 auto' },
  ctaTitle:    { fontFamily:'"DM Serif Display", Georgia, serif', fontSize:'clamp(28px, 4vw, 38px)', lineHeight:1.15, color:'#fff', margin:'0 0 14px', fontWeight:400, letterSpacing:'-0.02em' },
  ctaSub:      { fontSize:16, color:'oklch(0.85 0.06 268)', lineHeight:1.6, margin:'0 0 28px' },
  ctaBtns:     { display:'flex', gap:12, justifyContent:'center' },
  ctaPrimary:  { display:'inline-flex', alignItems:'center', justifyContent:'center', background:'#fff', color:'oklch(0.25 0.15 268)', fontSize:15, fontWeight:700, textDecoration:'none', borderRadius:12, padding:'14px 26px' },
  ctaGhost:    { display:'inline-flex', alignItems:'center', justifyContent:'center', background:'transparent', color:'#fff', fontSize:15, fontWeight:600, textDecoration:'none', borderRadius:12, padding:'14px 26px', border:'1px solid oklch(0.7 0.08 268)' },

  footer:      { display:'flex', justifyContent:'center', flexWrap:'wrap', gap:10, padding:'28px 24px 36px', fontSize:13, color:'oklch(0.6 0.03 268)' },
  footerDot:   { color:'oklch(0.78 0.04 268)' },
};
