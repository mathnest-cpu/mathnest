import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

type Result = {
  id: string;
  worksheet_title: string;
  worksheet_class: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
};

function statusFor(pct: number) {
  if (pct >= 80) return { label: "Pass", color: "bg-emerald-500", text: "text-emerald-700", ring: "bg-emerald-100" };
  if (pct >= 50) return { label: "Review", color: "bg-amber-500", text: "text-amber-700", ring: "bg-amber-100" };
  return { label: "Needs work", color: "bg-red-500", text: "text-red-700", ring: "bg-red-100" };
}

export function StudentMyResults() {
  const { user } = useAuth();
  const email = user?.email ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["my-worksheet-results", email],
    enabled: !!email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worksheet_results" as any)
        .select("id,worksheet_title,worksheet_class,score,total_questions,percentage,completed_at")
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Result[];
    },
  });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Results</h2>
        <Badge variant="secondary">{data?.length ?? 0}</Badge>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : (data?.length ?? 0) === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No results yet — complete a worksheet to see your score here! 🚀
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((r) => {
            const s = statusFor(r.percentage);
            return (
              <div key={r.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold leading-tight">{r.worksheet_title}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${s.ring} ${s.text}`}>
                    {s.label}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold">
                    {r.score} <span className="text-base font-normal text-muted-foreground">/ {r.total_questions}</span>
                  </span>
                  <span className="text-sm font-semibold">{r.percentage}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${s.color} transition-all`}
                    style={{ width: `${Math.min(100, Math.max(0, r.percentage))}%` }}
                  />
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {format(new Date(r.completed_at), "dd MMM yyyy")}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{r.worksheet_class}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
