import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "MathNest — Your math classes, organised in one place" },
      {
        name: "description",
        content:
          "MathNest brings together sessions, worksheets, and attendance — so teachers can focus on teaching, not admin.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Nunito+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
});

// Sage & Cream palette — scoped locally so only this page is themed.
const PALETTE = {
  cream: "#f5f0e8",
  creamSoft: "#faf6ef",
  sageMist: "#dce5d4",
  sage: "#a8c0a0",
  sageDeep: "#7d9b76",
  ink: "#2f3a2c",
  inkSoft: "#5a6657",
};

const headingFont = "'Lora', Georgia, serif";
const bodyFont = "'Nunito Sans', system-ui, sans-serif";

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [session, loading, navigate]);

  return (
    <div
      style={{
        background: PALETTE.creamSoft,
        color: PALETTE.ink,
        fontFamily: bodyFont,
      }}
      className="min-h-screen"
    >
      {/* Nav */}
      <header style={{ borderBottom: `1px solid ${PALETTE.sageMist}` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-2xl font-bold text-white shrink-0"
              style={{ background: PALETTE.sageDeep, fontFamily: headingFont }}
            >
              M
            </div>
            <span className="text-lg font-semibold" style={{ fontFamily: headingFont }}>
              MathNest
            </span>
          </div>
          <nav>
            <Link
              to="/auth"
              className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={{ color: PALETTE.sageDeep }}
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: `linear-gradient(180deg, ${PALETTE.cream} 0%, ${PALETTE.sageMist} 100%)`,
              opacity: 0.7,
            }}
          />
          <div className="mx-auto max-w-5xl px-6 py-20 text-center md:py-28">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{ background: PALETTE.sageMist, color: PALETTE.sageDeep }}
            >
              Online math tuition · invite only
            </span>
            <h1
              className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.1] md:text-6xl"
              style={{ fontFamily: headingFont, fontWeight: 600, color: PALETTE.ink }}
            >
              Your Math Classes, Organised in One Place.
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl text-lg md:text-xl"
              style={{ color: PALETTE.inkSoft }}
            >
              MathNest brings together sessions, worksheets, and attendance — so you can
              focus on teaching, not admin.
            </p>
            <div className="mt-9">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-full px-8 py-3.5 text-base font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5"
                style={{ background: PALETTE.sageDeep }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                emoji: "📅",
                title: "Scheduled Sessions",
                body: "Never miss a class — sessions sync to your calendar.",
              },
              {
                emoji: "📝",
                title: "Worksheets on Notion",
                body: "Access all your worksheets instantly, one click away.",
              },
              {
                emoji: "✅",
                title: "Attendance Tracking",
                body: "Track every session, for every student, effortlessly.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-3xl p-7 transition-transform hover:-translate-y-1"
                style={{
                  background: "#ffffff",
                  border: `1px solid ${PALETTE.sageMist}`,
                  boxShadow: "0 4px 18px -10px rgba(125, 155, 118, 0.25)",
                }}
              >
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
                  style={{ background: PALETTE.cream }}
                  aria-hidden
                >
                  {f.emoji}
                </div>
                <h3
                  className="mt-5 text-xl"
                  style={{ fontFamily: headingFont, fontWeight: 600, color: PALETTE.ink }}
                >
                  {f.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed" style={{ color: PALETTE.inkSoft }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Who it's for */}
        <section
          className="px-6 py-20 md:py-24"
          style={{ background: PALETTE.cream }}
        >
          <div className="mx-auto max-w-6xl">
            <h2
              className="text-center text-3xl md:text-4xl"
              style={{ fontFamily: headingFont, fontWeight: 600, color: PALETTE.ink }}
            >
              Who It's For
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {[
                {
                  tag: "For Teachers",
                  body: "Schedule classes, share worksheets, and track attendance — all from one dashboard.",
                },
                {
                  tag: "For Students",
                  body: "See your sessions, open worksheets, and track your own progress.",
                },
              ].map((c) => (
                <div
                  key={c.tag}
                  className="rounded-3xl p-8 md:p-10"
                  style={{
                    background: "#ffffff",
                    border: `1px solid ${PALETTE.sageMist}`,
                  }}
                >
                  <span
                    className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                    style={{ background: PALETTE.sageMist, color: PALETTE.sageDeep }}
                  >
                    {c.tag}
                  </span>
                  <p
                    className="mt-5 text-lg leading-relaxed"
                    style={{ color: PALETTE.ink, fontFamily: headingFont, fontWeight: 500 }}
                  >
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why MathNest */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <h2
            className="text-center text-3xl md:text-4xl"
            style={{ fontFamily: headingFont, fontWeight: 600, color: PALETTE.ink }}
          >
            Why MathNest
          </h2>
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
            {[
              {
                emoji: "🌍",
                text: "Built for global classrooms across India, US, UK, Canada & Australia.",
              },
              {
                emoji: "🔒",
                text: "Invite-only access — your classroom stays private.",
              },
              {
                emoji: "⚡",
                text: "Simple by design — no clutter, no confusion.",
              },
            ].map((v) => (
              <div
                key={v.text}
                className="rounded-2xl p-6 text-center"
                style={{ background: PALETTE.sageMist + "80" }}
              >
                <div className="text-3xl" aria-hidden>{v.emoji}</div>
                <p
                  className="mt-3 text-base leading-relaxed"
                  style={{ color: PALETTE.ink }}
                >
                  {v.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: PALETTE.sageDeep,
          color: "#f5f0e8",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-center md:flex-row md:text-left">
          <div>
            <div
              className="text-xl"
              style={{ fontFamily: headingFont, fontWeight: 600 }}
            >
              MathNest
            </div>
            <div className="mt-1 text-sm opacity-90">Learning made simple.</div>
          </div>
          <Link
            to="/auth"
            className="rounded-full px-5 py-2 text-sm font-semibold"
            style={{ background: PALETTE.cream, color: PALETTE.sageDeep }}
          >
            Login
          </Link>
        </div>
        <div
          className="mx-auto max-w-6xl px-6 pb-8 text-center text-xs opacity-70 md:text-left"
        >
          © {new Date().getFullYear()} MathNest
        </div>
      </footer>
    </div>
  );
}
