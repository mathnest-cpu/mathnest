import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in · NumeriQ" }] }),
});

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [session, loading, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-[image:var(--gradient-hero)] px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground font-bold shadow-[var(--shadow-soft)]">
            N
          </div>
          <span className="text-xl font-semibold">NumeriQ</span>
        </Link>
        <Card className="p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with the Google account associated with your invite.
          </p>
          <div className="mt-6">
            <GoogleSignInButton />
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            New here? Students need an invite link from their teacher to join.
          </p>
        </Card>
      </div>
    </div>
  );
}
