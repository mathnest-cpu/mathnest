import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import logoHorizontal from "@/assets/mathnest-logo-horizontal-dark.svg.asset.json";
import logoFull from "@/assets/mathnest-logo-full-dark.svg.asset.json";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "MathNest — Interactive math worksheets for Class 3 to 10" },
      {
        name: "description",
        content:
          "Interactive math worksheets for Class 3 to Class 10 — auto-scored, progress-tracked, and built for students across India, US, UK, Canada and Australia.",
      },
    ],
  }),

});

const C = {
  page: "#1a1f2e",
  card: "#242938",
  border: "#2e3447",
  green: "#1D9E75",
  greenMid: "#5DCAA5",
  greenLight: "#9FE1CB",
  text: "#f0f4f8",
  textSec: "#9FE1CB",
  textMuted: "#6b7694",
};

const SIGNUPS = [
  ["Aarav Sharma", "Chandigarh, India"],
  ["Priya Nair", "Melbourne, Australia"],
  ["Rohan Mehta", "Toronto, Canada"],
  ["Diya Patel", "Tampa, USA"],
  ["Vivaan Singh", "London, UK"],
  ["Ananya Joshi", "Delhi, India"],
  ["Kabir Verma", "Sydney, Australia"],
  ["Ishaan Gupta", "Vancouver, Canada"],
  ["Meera Iyer", "Birmingham, UK"],
  ["Arjun Reddy", "Houston, USA"],
  ["Zara Khan", "Mumbai, India"],
  ["Neil D'Souza", "Auckland, NZ"],
  ["Sophia Williams", "Manchester, UK"],
  ["Aiden Brown", "Calgary, Canada"],
  ["Kavya Pillai", "Bangalore, India"],
] as const;

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [session, loading, navigate]);

  return (
    <div style={{ background: C.page, color: C.text }} className="min-h-screen">
      <Nav />
      <Hero />
      <Features />
      <WhoFor />
      <WhyMathNest />
      <Footer />
      <SocialProof />
    </div>
  );
}

function Nav() {
  return (
    <header style={{ background: C.page, borderBottom: `1px solid ${C.border}` }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" aria-label="MathNest home">
          <img src={logoHorizontal.url} alt="MathNest" width={170} height={34} />
        </Link>
        <nav className="flex items-center gap-5">
          <a href="#features" style={{ color: C.greenLight, fontSize: 13 }} className="hidden sm:inline">Features</a>
          <a href="#why" style={{ color: C.greenLight, fontSize: 13 }} className="hidden sm:inline">Why MathNest</a>
          <Link
            to="/auth"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: C.green, borderRadius: 8 }}
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const count = useLiveCounter();
  return (
    <section style={{ background: C.page }} className="px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div>
          <h1
            className="text-[34px] leading-[1.15] md:text-[42px]"
            style={{ color: C.text, fontWeight: 500, letterSpacing: "-0.5px" }}
          >
            Your math classes, organised in one place
          </h1>
          <p className="mt-5 max-w-xl" style={{ color: C.greenLight, fontSize: 16, lineHeight: 1.6 }}>
            Interactive math worksheets for Class 3 to Class 10 — auto-scored, progress-tracked,
            and built for students across India, US, UK, Canada and Australia.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="rounded-lg px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: C.green }}
            >
              Get started
            </Link>
            <a
              href="#features"
              className="rounded-lg px-6 py-3 text-sm font-medium transition-colors"
              style={{ border: `1px solid ${C.border}`, color: C.text, background: "transparent" }}
            >
              Learn more
            </a>
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm" style={{ color: C.textMuted }}>
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: C.greenMid, boxShadow: `0 0 0 4px ${C.greenMid}22` }}
              aria-hidden
            />
            Joined by <span style={{ color: C.greenLight, fontWeight: 500 }}>{count}+</span> students across 5 countries
          </div>
        </div>
        <HeroIllustration />
      </div>
    </section>
  );
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 360" className="mx-auto w-full max-w-md" role="img" aria-label="MathNest dashboard illustration">
      {/* mountain backdrop */}
      <path d="M0 280 L120 140 L210 220 L300 110 L420 240 L480 200 L480 360 L0 360 Z" fill={C.card} />
      <path d="M0 300 L100 200 L180 260 L280 180 L380 280 L480 240 L480 360 L0 360 Z" fill={C.border} opacity="0.7" />
      {/* laptop base */}
      <rect x="80" y="280" width="320" height="14" rx="4" fill={C.border} />
      {/* screen */}
      <rect x="100" y="120" width="280" height="170" rx="10" fill={C.page} stroke={C.border} strokeWidth="1.5" />
      <rect x="100" y="120" width="280" height="22" rx="10" fill={C.card} />
      <circle cx="114" cy="131" r="3" fill={C.green} />
      <circle cx="124" cy="131" r="3" fill={C.greenMid} opacity="0.6" />
      <circle cx="134" cy="131" r="3" fill={C.greenLight} opacity="0.4" />
      {/* dashboard cards */}
      <rect x="114" y="156" width="80" height="50" rx="6" fill={C.card} />
      <rect x="122" y="166" width="40" height="6" rx="3" fill={C.greenMid} />
      <rect x="122" y="180" width="58" height="12" rx="3" fill={C.greenLight} />
      <rect x="204" y="156" width="80" height="50" rx="6" fill={C.card} />
      <rect x="212" y="166" width="40" height="6" rx="3" fill={C.greenMid} />
      <rect x="212" y="180" width="50" height="12" rx="3" fill={C.greenLight} />
      <rect x="294" y="156" width="72" height="50" rx="6" fill={C.green} />
      <rect x="302" y="166" width="34" height="6" rx="3" fill="#ffffff" opacity="0.8" />
      <rect x="302" y="180" width="46" height="12" rx="3" fill="#ffffff" />
      {/* chart */}
      <rect x="114" y="216" width="252" height="64" rx="6" fill={C.card} />
      <polyline points="124,266 160,250 196,256 232,232 268,240 304,220 340,228 356,212" fill="none" stroke={C.greenMid} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="124,266 160,250 196,256 232,232 268,240 304,220 340,228 356,212 356,278 124,278" fill={C.greenMid} opacity="0.12" />
      {/* mountain mark floating */}
      <g transform="translate(370 60)">
        <rect width="44" height="44" rx="11" fill={C.green} />
        <path d="M8 36 L22 14 L36 36" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 36 L22 24 L31 36 Z" fill="#fff" />
      </g>
    </svg>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div
      className="rounded-xl p-7"
      style={{ background: C.page, border: `1px solid ${C.border}`, borderRadius: 12 }}
    >
      <div className="mb-5">{icon}</div>
      <h3 style={{ color: C.text, fontSize: 18, fontWeight: 500 }}>{title}</h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: C.textMuted }}>{body}</p>
    </div>
  );
}

function Features() {
  return (
    <section id="features" style={{ background: C.card }} className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl md:text-4xl" style={{ color: C.text, fontWeight: 500 }}>
          Everything you need, nothing you don't
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<CalendarIcon />}
            title="Scheduled sessions"
            body="See every class on a clean calendar. Reminders so nobody misses a session."
          />
          <FeatureCard
            icon={<DocIcon />}
            title="Worksheets on GitHub Pages"
            body="Access curated worksheets instantly. Free students get a sample, paid get the full library."
          />
          <FeatureCard
            icon={<CheckIcon />}
            title="Attendance tracking"
            body="One-tap attendance per session. Parents and teachers always know who showed up."
          />
        </div>
      </div>
    </section>
  );
}

function WhoFor() {
  return (
    <section style={{ background: C.page }} className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl md:text-4xl" style={{ color: C.text, fontWeight: 500 }}>
          Who it's for
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[
            { tag: "For Teachers", body: "Schedule classes, assign worksheets, track attendance, and message parents — all in one dashboard.", art: <TeacherArt /> },
            { tag: "For Students", body: "See your sessions, open worksheets, and watch your scores climb week after week.", art: <StudentArt /> },
          ].map((c) => (
            <div
              key={c.tag}
              className="rounded-xl p-8"
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}
            >
              {c.art}
              <h3 className="mt-6" style={{ color: C.text, fontSize: 20, fontWeight: 500 }}>{c.tag}</h3>
              <p className="mt-3 text-base leading-relaxed" style={{ color: C.greenLight }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyMathNest() {
  const items = [
    { icon: <GlobeIcon />, head: "Built for 5 countries", body: "India · US · UK · Canada · Australia" },
    { icon: <LockIcon />, head: "Invite-only access", body: "Your classroom stays private — no public sign-ups." },
    { icon: <BoltIcon />, head: "Cancel anytime", body: "No lock-in. Keep access until the cycle ends." },
  ];
  return (
    <section id="why" style={{ background: C.card }} className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl md:text-4xl" style={{ color: C.text, fontWeight: 500 }}>
          Why MathNest
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.head}
              className="flex gap-4 rounded-xl p-6"
              style={{ background: C.page, border: `1px solid ${C.border}` }}
            >
              <div className="shrink-0">{it.icon}</div>
              <div>
                <div style={{ color: C.text, fontSize: 16, fontWeight: 500 }}>{it.head}</div>
                <div className="mt-1 text-sm" style={{ color: C.textMuted }}>{it.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: C.page, borderTop: `1px solid ${C.border}` }}>
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <img src={logoFull.url} alt="MathNest" width={220} height={50} />
          <div className="text-sm" style={{ color: C.textMuted }}>Learning made simple.</div>
        </div>
        <div className="flex gap-6 text-xs" style={{ color: C.textMuted }}>
          <Link to="/auth" className="hover:opacity-80">Login</Link>
          <Link to="/policy" className="hover:opacity-80">Policy</Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 pb-8 text-xs" style={{ color: C.textMuted }}>
        © {new Date().getFullYear()} MathNest
      </div>
    </footer>
  );
}

/* ---------- Icons (inline SVG) ---------- */
function CalendarIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="10" width="36" height="32" rx="6" stroke={C.greenMid} strokeWidth="2" />
      <path d="M6 18 H42" stroke={C.greenMid} strokeWidth="2" />
      <rect x="14" y="6" width="3" height="8" rx="1.5" fill={C.green} />
      <rect x="31" y="6" width="3" height="8" rx="1.5" fill={C.green} />
      <rect x="13" y="24" width="6" height="6" rx="1.5" fill={C.green} />
      <rect x="21" y="24" width="6" height="6" rx="1.5" fill={C.greenLight} opacity="0.6" />
      <rect x="29" y="24" width="6" height="6" rx="1.5" fill={C.greenLight} opacity="0.6" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M12 6 H28 L38 16 V40 a2 2 0 0 1 -2 2 H12 a2 2 0 0 1 -2 -2 V8 a2 2 0 0 1 2 -2 Z" stroke={C.greenMid} strokeWidth="2" />
      <path d="M28 6 V16 H38" stroke={C.greenMid} strokeWidth="2" fill="none" />
      <path d="M16 24 H32 M16 30 H32 M16 36 H26" stroke={C.green} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="8" width="36" height="32" rx="6" stroke={C.greenMid} strokeWidth="2" />
      <path d="M14 22 l5 5 l10 -10" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M14 34 H34" stroke={C.greenLight} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" stroke={C.green} strokeWidth="2" />
      <path d="M4 16 H28 M16 4 c5 4 5 20 0 24 M16 4 c-5 4 -5 20 0 24" stroke={C.green} strokeWidth="2" fill="none" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="6" y="14" width="20" height="14" rx="3" stroke={C.green} strokeWidth="2" />
      <path d="M10 14 V10 a6 6 0 0 1 12 0 V14" stroke={C.green} strokeWidth="2" fill="none" />
      <circle cx="16" cy="21" r="2" fill={C.green} />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M18 3 L6 18 H15 L13 29 L26 13 H17 Z" stroke={C.green} strokeWidth="2" fill={C.green} fillOpacity="0.15" strokeLinejoin="round" />
    </svg>
  );
}
function TeacherArt() {
  return (
    <svg viewBox="0 0 240 130" className="w-full max-w-xs" aria-hidden>
      <rect x="6" y="6" width="228" height="118" rx="10" fill={C.page} stroke={C.border} />
      <rect x="6" y="6" width="228" height="22" rx="10" fill={C.border} />
      <rect x="18" y="40" width="60" height="36" rx="6" fill={C.green} opacity="0.85" />
      <rect x="86" y="40" width="60" height="36" rx="6" fill={C.border} />
      <rect x="154" y="40" width="72" height="36" rx="6" fill={C.border} />
      <rect x="18" y="84" width="208" height="32" rx="6" fill={C.border} />
      <polyline points="28,108 60,96 100,102 140,88 180,94 216,82" fill="none" stroke={C.greenMid} strokeWidth="2" />
    </svg>
  );
}
function StudentArt() {
  return (
    <svg viewBox="0 0 240 130" className="w-full max-w-xs" aria-hidden>
      <rect x="20" y="14" width="200" height="102" rx="10" fill={C.page} stroke={C.border} />
      <rect x="34" y="30" width="80" height="10" rx="3" fill={C.greenLight} />
      <rect x="34" y="48" width="172" height="6" rx="3" fill={C.border} />
      <rect x="34" y="60" width="160" height="6" rx="3" fill={C.border} />
      <rect x="34" y="72" width="120" height="6" rx="3" fill={C.border} />
      <rect x="34" y="92" width="60" height="14" rx="4" fill={C.green} />
      <rect x="104" y="92" width="40" height="14" rx="4" fill={C.border} />
    </svg>
  );
}

/* ---------- Live counter ---------- */
function useLiveCounter() {
  const [n, setN] = useState(240);
  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem("mn_signup_counter"));
      if (stored && stored >= 240) setN(stored);
    } catch {}
    let stop = false;
    const tick = () => {
      if (stop) return;
      const delay = 45000 + Math.random() * 45000;
      setTimeout(() => {
        setN((v) => {
          const nv = v + 1;
          try { localStorage.setItem("mn_signup_counter", String(nv)); } catch {}
          return nv;
        });
        tick();
      }, delay);
    };
    tick();
    return () => { stop = true; };
  }, []);
  return n;
}

/* ---------- Social proof toast ---------- */
function SocialProof() {
  const [current, setCurrent] = useState<{ name: string; loc: string } | null>(null);
  const lastShownRef = useRef(0);

  const pool = useMemo(() => SIGNUPS.slice(), []);

  useEffect(() => {
    let stop = false;
    let hideTimer: number | undefined;
    const schedule = () => {
      if (stop) return;
      const wait = 12000 + Math.random() * 6000;
      setTimeout(() => {
        if (stop) return;
        const now = Date.now();
        if (now - lastShownRef.current < 15000) {
          schedule();
          return;
        }
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setCurrent({ name: pick[0], loc: pick[1] });
        lastShownRef.current = Date.now();
        hideTimer = window.setTimeout(() => setCurrent(null), 4000);
        schedule();
      }, wait);
    };
    schedule();
    return () => { stop = true; if (hideTimer) clearTimeout(hideTimer); };
  }, [pool]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-4 z-50 max-w-[320px] transition-all duration-300"
      style={{
        opacity: current ? 1 : 0,
        transform: current ? "translateY(0)" : "translateY(8px)",
      }}
    >
      {current && (
        <div
          className="flex items-start gap-3 rounded-[10px] px-4 py-3 shadow-lg"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-medium text-white"
            style={{ background: C.green }}
          >
            {initials(current.name)}
          </div>
          <div className="min-w-0 flex-1 pr-4">
            <div style={{ color: C.text, fontSize: 13, fontWeight: 500 }} className="leading-tight">
              {current.name} <span style={{ color: C.textMuted, fontWeight: 400 }}>signed up for</span> Monthly Worksheets
            </div>
            <div className="mt-0.5" style={{ color: C.textMuted, fontSize: 12 }}>{current.loc}</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden className="shrink-0">
            <rect width="16" height="16" rx="4" fill={C.green} />
            <path d="M3 13 L8 5 L13 13" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.5 13 L8 9 L10.5 13 Z" fill="#fff" />
          </svg>
        </div>
      )}
    </div>
  );
}
