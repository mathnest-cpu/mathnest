import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarPlus, Trash2, Video } from "lucide-react";
import { safeHttpUrl } from "@/lib/safe-url";

const GRADES = [3, 4, 5, 6, 7, 8, 9, 10];

export function SessionsPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const [form, setForm] = useState({
    title: "",
    description: "",
    starts_at: today,
    duration: "60",
    grade: "5",
    meeting_url: "",
  });

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sessions").select("*").order("starts_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title) throw new Error("Title required");
      if (form.meeting_url && !safeHttpUrl(form.meeting_url)) throw new Error("Meeting link must start with http(s)://");
      const starts = new Date(form.starts_at);
      const ends = new Date(starts.getTime() + Number(form.duration) * 60_000);
      const { error } = await supabase.from("sessions").insert({
        title: form.title,
        description: form.description || null,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        grade: Number(form.grade),
        meeting_url: form.meeting_url || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Session scheduled");
      setForm({ ...form, title: "", description: "", meeting_url: "" });
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Schedule a session</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Your timezone: {tz}</p>
        <div className="mt-4 grid gap-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Algebra recap" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Starts at</Label>
              <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input type="number" min={15} step={15} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Grade</Label>
              <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => <SelectItem key={g} value={String(g)}>Class {g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Meeting link</Label>
              <Input placeholder="https://meet.google.com/…" value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} />
            </div>
          </div>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            <CalendarPlus className="mr-2 h-4 w-4" />{create.isPending ? "Scheduling…" : "Schedule"}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold">Upcoming & past sessions</h2>
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : (sessions?.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No sessions scheduled.
            </div>
          ) : sessions!.map((s) => {
            const start = new Date(s.starts_at);
            const isPast = start.getTime() < Date.now();
            return (
              <div key={s.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
                <div>
                  <div className="font-medium">{s.title} {s.grade && <span className="ml-2 text-xs text-muted-foreground">Class {s.grade}</span>}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(start, "EEE, MMM d · h:mm a")} ({tz}) {isPast && "· past"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const safe = safeHttpUrl(s.meeting_url);
                    return safe ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={safe} target="_blank" rel="noreferrer"><Video className="mr-1 h-4 w-4" />Join</a>
                      </Button>
                    ) : null;
                  })()}
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
