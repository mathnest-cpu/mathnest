import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Video } from "lucide-react";
import { format } from "date-fns";

export function StudentSessions() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data, isLoading } = useQuery({
    queryKey: ["my-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .gte("ends_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Upcoming classes</h2>
        </div>
        <span className="text-xs text-muted-foreground">Times in {tz}</span>
      </div>

      <div className="mt-4 space-y-2">
        {isLoading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No classes scheduled yet.
          </div>
        ) : data!.map((s) => {
          const start = new Date(s.starts_at);
          const end = new Date(s.ends_at);
          return (
            <div key={s.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
              <div>
                <div className="font-medium">{s.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {format(start, "EEE, MMM d · h:mm a")} – {format(end, "h:mm a")}
                </div>
                {s.description && <div className="mt-1 text-sm">{s.description}</div>}
              </div>
              {s.meeting_url && (
                <Button asChild size="sm">
                  <a href={s.meeting_url} target="_blank" rel="noreferrer"><Video className="mr-1 h-4 w-4" />Join</a>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
