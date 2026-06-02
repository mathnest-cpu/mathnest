import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles } from "lucide-react";
import { StudentSessions } from "@/components/student/StudentSessions";
import { StudentAttendance } from "@/components/student/StudentAttendance";
import { StudentWorksheets } from "@/components/student/StudentWorksheets";
import { StudentMyResults } from "@/components/student/StudentMyResults";

export const Route = createFileRoute("/_app/student")({
  component: StudentDashboard,
  head: () => ({ meta: [{ title: "My dashboard · MathNest" }] }),
});

function StudentDashboard() {
  const { role, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role !== "student") navigate({ to: "/dashboard", replace: true });
  }, [role, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  // Auto-detect & persist timezone if missing
  useEffect(() => {
    if (!user || !profile || profile.timezone) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) supabase.from("profiles").update({ timezone: tz }).eq("id", user.id).then();
  }, [user, profile]);

  if (loading || role !== "student") return <div className="text-muted-foreground">Loading…</div>;

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[image:var(--gradient-hero)] p-8 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" /> Welcome back
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Hi {firstName}!</h1>
        <p className="mt-1 text-muted-foreground">
          {profile?.grade ? `You're in Class ${profile.grade}.` : "Your class will appear once your teacher sets it up."}
        </p>
      </div>

      <StudentWorksheets />

      <StudentMyResults />

      <StudentResultsSubmit />




      <div className="grid gap-4 md:grid-cols-2">
        <StudentSessions />
        <StudentAttendance />
      </div>
    </div>
  );
}
