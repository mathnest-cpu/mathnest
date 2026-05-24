import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Users, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "NumeriQ — Online Math Tuition for Grades 3–10" },
      { name: "description", content: "Personal online math tuition for students worldwide. Worksheets, scheduled classes and progress tracking — all in one friendly place." },
    ],
  }),
});

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [session, loading, navigate]);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground font-bold shadow-[var(--shadow-soft)]">
              N
            </div>
            <span className="text-lg font-semibold tracking-tight">NumeriQ</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost">Sign in</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[image:var(--gradient-hero)] opacity-60" />
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Grades 3 – 10 · India · US · UK · Canada · Australia
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
                Math tuition that feels personal — and grows with your child.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground">
                NumeriQ helps Nisha's students learn, practise and track progress from anywhere in the world. Worksheets, classes and attendance — all in one calm place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth">
                  <Button size="lg" className="gap-2 shadow-[var(--shadow-soft)]">
                    Get started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline">How it works</Button>
                </a>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Students join by invitation from their teacher.
              </p>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Users, title: "Invite-only roster", body: "Nisha invites each student personally — no public sign-ups." },
              { icon: BookOpen, title: "Worksheets, organised", body: "Tag by grade and topic. Students get exactly what they need." },
              { icon: Calendar, title: "Classes & attendance", body: "Schedule sessions, mark attendance, track progress over time." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} NumeriQ
        </div>
      </footer>
    </div>
  );
}
