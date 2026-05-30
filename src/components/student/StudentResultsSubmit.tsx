import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

function sanitize(s: string) {
  return s.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 60) || "untitled";
}

export function StudentResultsSubmit() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [pending, setPending] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["my-profile-name", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: worksheets, isLoading } = useQuery({
    queryKey: ["my-worksheets-submit", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worksheets")
        .select("id,title")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: submitted } = useQuery({
    queryKey: ["my-submitted-results", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_results")
        .select("worksheet_id,submitted_at")
        .eq("student_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const submittedMap = useMemo(() => {
    const m = new Map<string, string>();
    (submitted ?? []).forEach((r: any) => m.set(r.worksheet_id, r.submitted_at));
    return m;
  }, [submitted]);

  const submit = useMutation({
    mutationFn: async ({ worksheetId, title }: { worksheetId: string; title: string }) => {
      const file = files[worksheetId];
      if (!file) throw new Error("Choose a PDF first");
      if (file.type !== "application/pdf") throw new Error("Only PDF files are allowed");
      const studentName = profile?.full_name?.trim() || "Student";
      const dateStr = format(new Date(), "yyyy-MM-dd");
      const fileName = `${sanitize(studentName)}_${sanitize(title)}_${dateStr}.pdf`;
      const path = `${user!.id}/${worksheetId}/${Date.now()}_${fileName}`;

      const { error: upErr } = await supabase.storage
        .from("student-results")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await (supabase.from("student_results") as any).insert({
        student_id: user!.id,
        student_name: studentName,
        worksheet_id: worksheetId,
        worksheet_title: title,
        drive_url: path,
      });
      if (insErr) throw insErr;
    },
    onMutate: ({ worksheetId }) => setPending(worksheetId),
    onSettled: () => setPending(null),
    onSuccess: (_d, vars) => {
      toast.success("✅ Result submitted! Your teacher will review it soon.");
      setFiles((f) => ({ ...f, [vars.worksheetId]: null }));
      qc.invalidateQueries({ queryKey: ["my-submitted-results", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Upload className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Submit My Result</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Upload your completed worksheet as a PDF.</p>

      <div className="mt-4 grid gap-3">
        {isLoading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : (worksheets ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No worksheets to submit yet.
          </div>
        ) : (
          (worksheets ?? []).map((w) => {
            const done = submittedMap.get(w.id);
            return (
              <div key={w.id} className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{w.title}</div>
                    {done && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        Submitted {format(new Date(done), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>
                  {done ? (
                    <Badge variant="secondary">Submitted</Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="max-w-[220px]"
                        onChange={(e) =>
                          setFiles((f) => ({ ...f, [w.id]: e.target.files?.[0] ?? null }))
                        }
                      />
                      <Button
                        size="sm"
                        disabled={pending === w.id || !files[w.id]}
                        onClick={() => submit.mutate({ worksheetId: w.id, title: w.title })}
                      >
                        {pending === w.id ? "Uploading…" : "Submit"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
