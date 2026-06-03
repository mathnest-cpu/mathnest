import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export function SubscriptionsPanel() {
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

      // Worksheets-per-class for "X / total done"
      const { data: wsheets } = await supabase.from("worksheets").select("assigned_grades");
      const totalForGrade = (g: number | null) => {
        if (g == null) return 0;
        return (wsheets ?? []).filter((w) => (w.assigned_grades ?? []).includes(g)).length;
      };

      return students.map((s) => ({
        ...s,
        completed: completedByEmail.get((s.email ?? "").toLowerCase()) ?? 0,
        total: totalForGrade(s.grade),
      }));
    },
  });

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>
              ) : (data?.length ?? 0) === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-muted-foreground">No students yet.</TableCell></TableRow>
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
