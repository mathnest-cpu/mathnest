import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BookOpen, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/student")({
  component: StudentDashboard,
  head: () => ({ meta: [{ title: "My dashboard · NumeriQ" }] }),
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

  const { data: worksheets, isLoading } = useQuery({
    queryKey: ["my-worksheets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worksheets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const download = async (path: string, name: string) => {
    const { data, error } = await supabase.storage.from("worksheets").createSignedUrl(path, 60);
    if (error) return toast.error(error.message);
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name;
    a.click();
  };

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

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Your worksheets</h2>
        </div>
        <p className="text-sm text-muted-foreground">All worksheets assigned to your class.</p>

        <div className="mt-4 grid gap-3">
          {isLoading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : (worksheets?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              No worksheets yet — your teacher will share them here.
            </div>
          ) : worksheets!.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
              <div>
                <div className="font-medium">{w.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Class {w.grade}</span>
                  {w.topic && <><span>·</span><span>{w.topic}</span></>}
                  <span>·</span>
                  <span>Assigned {format(new Date(w.created_at), "MMM d")}</span>
                </div>
              </div>
              <Button size="sm" onClick={() => download(w.storage_path, w.file_name)}>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
