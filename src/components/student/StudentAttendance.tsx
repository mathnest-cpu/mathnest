import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  present: "bg-primary/15 text-primary",
  absent: "bg-destructive/15 text-destructive",
  late: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  excused: "bg-muted text-muted-foreground",
};

export function StudentAttendance() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-attendance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", user!.id)
        .order("session_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const counts = (data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Attendance history</h2>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(["present","late","absent","excused"] as const).map((s) => (
          <span key={s} className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_COLORS[s]}`}>
            {s} · {counts[s] ?? 0}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {isLoading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No attendance recorded yet.
          </div>
        ) : data!.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border bg-card p-3 text-sm">
            <div>
              <div className="font-medium">{format(new Date(r.session_date), "EEE, MMM d, yyyy")}</div>
              {r.notes && <div className="text-xs text-muted-foreground">{r.notes}</div>}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_COLORS[r.status]}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
