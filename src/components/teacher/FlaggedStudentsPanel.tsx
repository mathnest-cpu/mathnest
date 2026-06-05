import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Mail, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { sendParentEmail } from "@/lib/parent-emails.functions";

type FlaggedProfile = {
  id: string;
  full_name: string | null;
  grade: number | null;
  low_performance_count: number;
  parent_email: string | null;
  parent_phone: string | null;
  email: string;
};

type RecentResult = {
  id: string;
  student_name: string;
  student_email: string;
  worksheet_title: string;
  worksheet_class: string;
  percentage: number;
  completed_at: string;
};

export function FlaggedStudentsPanel() {
  const qc = useQueryClient();
  const sendFn = useServerFn(sendParentEmail);

  const { data: flagged } = useQuery({
    queryKey: ["flagged-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,grade,low_performance_count,parent_email,parent_phone,email")
        .eq("performance_flag", true);
      if (error) throw error;
      return (data ?? []) as FlaggedProfile[];
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["recent-low-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worksheet_results" as any)
        .select("id,student_name,student_email,worksheet_title,worksheet_class,percentage,completed_at")
        .order("completed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as RecentResult[];
    },
  });

  const { data: notifs } = useQuery({
    queryKey: ["recent-parent-notifs"],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("parent_notifications" as any)
        .select("student_id,notification_type,sent_at")
        .gte("sent_at", since);
      if (error) throw error;
      return (data ?? []) as unknown as Array<{ student_id: string; notification_type: string; sent_at: string }>;
    },
    refetchInterval: 60_000,
  });

  // Avg score per flagged student (from recent results)
  const avgByEmail = useMemo(() => {
    const map = new Map<string, { sum: number; n: number }>();
    for (const r of recent ?? []) {
      const k = r.student_email.toLowerCase();
      const m = map.get(k) ?? { sum: 0, n: 0 };
      m.sum += r.percentage; m.n += 1;
      map.set(k, m);
    }
    return map;
  }, [recent]);

  const cooldownFor = (studentId: string, type: "score_alert" | "one_to_one_request") => {
    return (notifs ?? []).some((n) => n.student_id === studentId && n.notification_type === type);
  };

  const sendMutation = useMutation({
    mutationFn: async (vars: { studentId: string; type: "score_alert" | "one_to_one_request"; worksheetTitle?: string; percentage?: number }) => {
      return sendFn({ data: vars });
    },
    onSuccess: () => {
      toast.success("Email sent to parent");
      qc.invalidateQueries({ queryKey: ["recent-parent-notifs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Map student_email → profile id (for the recent table)
  const { data: studentMap } = useQuery({
    queryKey: ["student-id-by-email"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email");
      if (error) throw error;
      const map = new Map<string, string>();
      for (const p of data ?? []) if (p.email) map.set(p.email.toLowerCase(), p.id);
      return map;
    },
  });

  const lowScores = (recent ?? []).filter((r) => r.percentage < 80);
  const flaggedList = flagged ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-5 border-amber-300/60">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold">Students Needing Attention</h2>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">Flagged students and recent low scores.</p>

        {/* Part A: Flagged */}
        {flaggedList.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Flagged ({flaggedList.length})</Badge>
              <span className="text-xs text-muted-foreground">Students with 5+ worksheets scored below 80%.</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Below 80%</TableHead>
                    <TableHead>Avg score</TableHead>
                    <TableHead>Parent email</TableHead>
                    <TableHead>Parent phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedList.map((s) => {
                    const stat = avgByEmail.get(s.email.toLowerCase());
                    const avg = stat ? Math.round(stat.sum / stat.n) : null;
                    const alertCooldown = cooldownFor(s.id, "score_alert");
                    const oneOnOneCooldown = cooldownFor(s.id, "one_to_one_request");
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.full_name ?? "—"}</TableCell>
                        <TableCell>{s.grade ? `Class ${s.grade}` : "—"}</TableCell>
                        <TableCell>{s.low_performance_count}</TableCell>
                        <TableCell>{avg != null ? `${avg}%` : "—"}</TableCell>
                        <TableCell>{s.parent_email ?? "—"}</TableCell>
                        <TableCell>{s.parent_phone ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-1">
                            <Button size="sm" variant="outline" disabled={alertCooldown || !s.parent_email || sendMutation.isPending}
                              onClick={() => sendMutation.mutate({ studentId: s.id, type: "score_alert" })}>
                              <Mail className="mr-1 h-3 w-3" /> {alertCooldown ? "Sent" : "Send alert"}
                            </Button>
                            <Button size="sm" disabled={oneOnOneCooldown || !s.parent_email || sendMutation.isPending}
                              onClick={() => sendMutation.mutate({ studentId: s.id, type: "one_to_one_request" })}>
                              <CalendarPlus className="mr-1 h-3 w-3" /> {oneOnOneCooldown ? "Sent" : "Request 1:1"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Part B: Recent scores */}
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">Recent low scores</Badge>
            <span className="text-xs text-muted-foreground">Last 50 submissions; only below-80% can be actioned.</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Last worksheet</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recent ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-muted-foreground">No recent submissions.</TableCell></TableRow>
                ) : (recent ?? []).map((r) => {
                  const isLow = r.percentage < 80;
                  const sid = studentMap?.get(r.student_email.toLowerCase());
                  const cooldown = sid ? cooldownFor(sid, "score_alert") : false;
                  return (
                    <TableRow key={r.id} className={isLow ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}>
                      <TableCell className="font-medium">{r.student_name}</TableCell>
                      <TableCell>{r.worksheet_class}</TableCell>
                      <TableCell>{r.worksheet_title}</TableCell>
                      <TableCell>{r.percentage}%</TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge className="bg-amber-500 hover:bg-amber-500">Below 80%</Badge>
                        ) : (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">Pass</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isLow ? (
                          <span className="text-xs text-muted-foreground">No action needed</span>
                        ) : !sid ? (
                          <span className="text-xs text-muted-foreground">No profile</span>
                        ) : (
                          <Button size="sm" variant="outline" disabled={cooldown || sendMutation.isPending}
                            onClick={() => sendMutation.mutate({ studentId: sid, type: "score_alert", worksheetTitle: r.worksheet_title, percentage: r.percentage })}>
                            <Mail className="mr-1 h-3 w-3" /> {cooldown ? "Sent" : "Alert parent"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
}
