import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { setStudentPlanManually } from "@/lib/teacher-subscription.functions";
import { toast } from "sonner";
import { format } from "date-fns";

type StudentRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  grade: number | null;
  plan: string | null;
  plan_status: string | null;
  billing_cycle_end: string | null;
  completed: number;
  total: number;
};

export function SubscriptionsPanel() {
  const qc = useQueryClient();
  const setPlan = useServerFn(setStudentPlanManually);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [plan, setPlan_] = useState<"paid" | "free">("paid");
  const [months, setMonths] = useState<string>("1");

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-subscriptions"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }, { data: results }] = await Promise.all([
        supabase.from("profiles").select("id,email,full_name,grade,plan,plan_status,billing_cycle_end"),
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("worksheet_results").select("student_email"),
      ]);
      if (error) throw error;
      const studentIds = new Set((roles ?? []).filter((r) => r.role === "student").map((r) => r.user_id));
      const completedByEmail = new Map<string, number>();
      for (const r of results ?? []) {
        const key = (r.student_email ?? "").toLowerCase();
        completedByEmail.set(key, (completedByEmail.get(key) ?? 0) + 1);
      }
      const students = (profiles ?? []).filter((p) => studentIds.has(p.id));

      const { data: wsheets } = await supabase.from("worksheets").select("assigned_grades");
      const totalForGrade = (g: number | null) => {
        if (g == null) return 0;
        return (wsheets ?? []).filter((w) => (w.assigned_grades ?? []).includes(g)).length;
      };

      return students.map((s) => ({
        ...s,
        completed: completedByEmail.get((s.email ?? "").toLowerCase()) ?? 0,
        total: totalForGrade(s.grade),
      })) as StudentRow[];
    },
  });

  const mutate = useMutation({
    mutationFn: async (args: { studentId: string; plan: "paid" | "free"; months: number }) =>
      setPlan({ data: args }),
    onSuccess: () => {
      toast.success("Subscription updated");
      qc.invalidateQueries({ queryKey: ["teacher-subscriptions"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (s: StudentRow) => {
    setEditing(s);
    setPlan_(s.plan === "paid" ? "paid" : "free");
    setMonths("1");
  };

  const total = data?.length ?? 0;
  const paid = (data ?? []).filter((s) => s.plan === "paid").length;
  const free = total - paid;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><div className="text-sm text-muted-foreground">Total students</div><div className="mt-2 text-3xl font-bold">{total}</div></Card>
        <Card className="p-5"><div className="text-sm text-muted-foreground">Paid subscribers</div><div className="mt-2 text-3xl font-bold text-emerald-600">{paid}</div></Card>
        <Card className="p-5"><div className="text-sm text-muted-foreground">Free tier</div><div className="mt-2 text-3xl font-bold">{free}</div></Card>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-semibold">Subscriptions</h2>
        <p className="text-sm text-muted-foreground">
          Use "Manage" to mark a student as paid or free manually (for offline payments).
        </p>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Next billing</TableHead>
                <TableHead>Worksheets</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7}>Loading…</TableCell></TableRow>
              ) : (data?.length ?? 0) === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-muted-foreground">No students yet.</TableCell></TableRow>
              ) : data!.map((s) => {
                const paidPlan = s.plan === "paid";
                const lapsing = s.plan_status === "lapsing";
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name ?? s.email}</TableCell>
                    <TableCell>{s.grade ? `Class ${s.grade}` : "—"}</TableCell>
                    <TableCell>
                      {paidPlan
                        ? <Badge className="bg-emerald-600 hover:bg-emerald-600">Paid ₹299</Badge>
                        : <Badge variant="secondary">Free</Badge>}
                    </TableCell>
                    <TableCell>{s.billing_cycle_end ? format(new Date(s.billing_cycle_end), "MMM d, yyyy") : "—"}</TableCell>
                    <TableCell>{s.completed} / {s.total} done</TableCell>
                    <TableCell>
                      {!paidPlan ? <Badge variant="secondary">Free</Badge>
                        : lapsing ? <Badge variant="outline">Lapsing</Badge>
                        : <Badge className="bg-emerald-600 hover:bg-emerald-600">Active</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage subscription</DialogTitle>
            <DialogDescription>
              {editing?.full_name ?? editing?.email} — set the plan manually. This overrides
              any Razorpay state for the chosen period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plan</Label>
              <Select value={plan} onValueChange={(v) => setPlan_(v as "paid" | "free")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid — grant worksheet access</SelectItem>
                  <SelectItem value="free">Free — revoke paid access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {plan === "paid" && (
              <div>
                <Label htmlFor="months">Access duration (months)</Label>
                <Input
                  id="months"
                  type="number"
                  min={1}
                  max={36}
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Access ends after this many months from today.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              disabled={mutate.isPending}
              onClick={() => {
                if (!editing) return;
                const m = Math.max(1, Math.min(36, Number(months) || 1));
                mutate.mutate({ studentId: editing.id, plan, months: m });
              }}
            >
              {mutate.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
