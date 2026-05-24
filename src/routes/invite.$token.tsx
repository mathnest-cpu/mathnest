import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
  head: () => ({ meta: [{ title: "Accept invite · NumeriQ" }] }),
});

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [invite, setInvite] = useState<{ email: string; grade: number; full_name: string | null; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Public read via head-meta. RLS forbids anon select, so use a public RPC-style:
    // we just look up by token via an edge-safe call. Since invites table is teacher-only,
    // we encode the invite info into the URL? Instead: fetch using anon -> will be empty.
    // Simplest: show generic page; after sign-in, redirect logic resolves the invite.
    (async () => {
      const { data } = await supabase
        .from("invites")
        .select("email,grade,full_name,status")
        .eq("token", token)
        .maybeSingle();
      if (data) setInvite(data);
      setLoading(false);
    })();
  }, [token]);

  useEffect(() => {
    if (session) {
      // After sign-in, the DB trigger auto-accepts the invite if emails match.
      navigate({ to: "/dashboard", replace: true });
    }
  }, [session, navigate]);

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
          {loading ? (
            <div className="text-muted-foreground">Loading invite…</div>
          ) : !invite ? (
            <div className="text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <h1 className="mt-3 text-xl font-semibold">Invite link</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in with the Google account your teacher invited. We'll match you to your invite.
              </p>
              <div className="mt-6">
                <GoogleSignInButton label="Continue with Google" />
              </div>
            </div>
          ) : invite.status !== "pending" ? (
            <div className="text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <h1 className="mt-3 text-xl font-semibold">Invite no longer active</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                This invite has been {invite.status}. Ask your teacher for a new one.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
              <h1 className="mt-3 text-xl font-semibold">You're invited!</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {invite.full_name ? `Hi ${invite.full_name}, you've ` : "You've "}
                been invited to join NumeriQ for <strong>Class {invite.grade}</strong>.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Sign in with <strong>{invite.email}</strong>.
              </p>
              <div className="mt-6">
                <GoogleSignInButton label="Accept & continue with Google" />
              </div>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </Card>
      </div>
    </div>
  );
}
