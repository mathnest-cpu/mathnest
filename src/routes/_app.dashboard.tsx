import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (role === "teacher") navigate({ to: "/teacher", replace: true });
    else if (role === "student") navigate({ to: "/student", replace: true });
  }, [role, loading, navigate]);

  if (!loading && !role) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-xl font-semibold">No access yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account isn't linked to a student profile. Ask your teacher to send you an invite link.
        </p>
      </div>
    );
  }
  return <div className="text-muted-foreground">Redirecting…</div>;
}
