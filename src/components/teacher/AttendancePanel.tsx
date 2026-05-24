import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarCheck } from "lucide-react";

const GRADES = [3, 4, 5, 6, 7, 8, 9, 10];
const STATUSES = ["present", "absent", "late", "excused"] as const;
type Status = typeof STATUSES[number];

export function AttendancePanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [grade, setGrade] = useState("all");

  const { data: students } = useQuery({
    queryKey: ["students-for-attendance", grade],
    queryFn: async () => {
      const roles = await supabase.from("user_roles").select("user_id").eq("role", "student");
      const ids = (roles.data ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      let q = supabase.from("profiles").select("id,full_name,email,grade").in("id", ids).order("full_name");
      if (grade !== "all") q = q.eq("grade", Number(grade));
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: records } = useQuery({
    queryKey: ["attendance", date],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance").select("*").eq("session_date", date);
      if (error) throw error;
      return data ?? [];
    },
  });

  const byStudent = useMemo(() => {
    const m = new Map<string, { status: Status; notes: string | null }>();
    (records ?? []).forEach((r) => m.set(r.student_id, { status: r.status as Status, notes: r.notes }));
    return m;
  }, [records]);

  const upsert = useMutation({
    mutationFn: async (v: { student_id: string; status: Status; notes?: string | null }) => {
      const { error } = await supabase.from("attendance").upsert(
        { student_id: v.student_id, session_date: date, status: v.status, notes: v.notes ?? null, marked_by: user!.id },
        { onConflict: "student_id,session_date" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance", date] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Attendance</h2>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Grade</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {GRADES.map((g) => <SelectItem key={g} value={String(g)}>Class {g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(students?.length ?? 0) === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-muted-foreground">No students.</TableCell></TableRow>
            ) : students!.map((s) => {
              const r = byStudent.get(s.id);
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name ?? s.email}</TableCell>
                  <TableCell>{s.grade ? `Class ${s.grade}` : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {STATUSES.map((st) => (
                        <Button
                          key={st}
                          size="sm"
                          variant={r?.status === st ? "default" : "outline"}
                          onClick={() => upsert.mutate({ student_id: s.id, status: st, notes: r?.notes })}
                          className="capitalize"
                        >
                          {st}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      defaultValue={r?.notes ?? ""}
                      placeholder="Optional note"
                      onBlur={(e) => {
                        if (!r) return;
                        if (e.target.value !== (r?.notes ?? "")) {
                          upsert.mutate({ student_id: s.id, status: r.status, notes: e.target.value || null });
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
