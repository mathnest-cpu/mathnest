import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Copy, Mail, Users, FileText, Send, CalendarCheck, CalendarDays, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { AttendancePanel } from "@/components/teacher/AttendancePanel";
import { SessionsPanel } from "@/components/teacher/SessionsPanel";
import { WorksheetsPanel } from "@/components/teacher/WorksheetsPanel";
import { StudentResultsPanel } from "@/components/teacher/StudentResultsPanel";
import { WorksheetResultsPanel } from "@/components/teacher/WorksheetResultsPanel";

export const Route = createFileRoute("/_app/teacher")({
  component: TeacherDashboard,
  head: () => ({ meta: [{ title: "Teacher Dashboard · MathNest" }] }),
});

const GRADES = [3, 4, 5, 6, 7, 8, 9, 10];
const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia"];

function TeacherDashboard() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role !== "teacher") navigate({ to: "/dashboard", replace: true });
  }, [role, loading, navigate]);

  if (loading || role !== "teacher") return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teacher dashboard</h1>
        <p className="text-muted-foreground">Manage students, invites and worksheets.</p>
      </div>

      <Overview />

      <Tabs defaultValue="students">
        <TabsList className="flex-wrap">
          <TabsTrigger value="students"><Users className="mr-2 h-4 w-4" />Students</TabsTrigger>
          <TabsTrigger value="invites"><Mail className="mr-2 h-4 w-4" />Invites</TabsTrigger>
          <TabsTrigger value="worksheets"><FileText className="mr-2 h-4 w-4" />Worksheets</TabsTrigger>
          <TabsTrigger value="results"><ClipboardCheck className="mr-2 h-4 w-4" />Results</TabsTrigger>
          <TabsTrigger value="worksheet-results"><ClipboardCheck className="mr-2 h-4 w-4" />Worksheet Scores</TabsTrigger>
          <TabsTrigger value="attendance"><CalendarCheck className="mr-2 h-4 w-4" />Attendance</TabsTrigger>
          <TabsTrigger value="sessions"><CalendarDays className="mr-2 h-4 w-4" />Sessions</TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="mt-4"><StudentsPanel /></TabsContent>
        <TabsContent value="invites" className="mt-4"><InvitesPanel /></TabsContent>
        <TabsContent value="worksheets" className="mt-4"><WorksheetsPanel /></TabsContent>
        <TabsContent value="results" className="mt-4"><StudentResultsPanel /></TabsContent>
        <TabsContent value="worksheet-results" className="mt-4"><WorksheetResultsPanel /></TabsContent>
        <TabsContent value="attendance" className="mt-4"><AttendancePanel /></TabsContent>
        <TabsContent value="sessions" className="mt-4"><SessionsPanel /></TabsContent>

      </Tabs>
    </div>
  );
}

function Overview() {
  const { data } = useQuery({
    queryKey: ["teacher-overview"],
    queryFn: async () => {
      const [students, invites, worksheets] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("invites").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("worksheets").select("id", { count: "exact", head: true }),
      ]);
      return {
        students: students.count ?? 0,
        pendingInvites: invites.count ?? 0,
        worksheets: worksheets.count ?? 0,
      };
    },
  });
  const cards = [
    { label: "Students", value: data?.students ?? "—" },
    { label: "Pending invites", value: data?.pendingInvites ?? "—" },
    { label: "Worksheets", value: data?.worksheets ?? "—" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.label} className="p-5">
          <div className="text-sm text-muted-foreground">{c.label}</div>
          <div className="mt-2 text-3xl font-bold">{c.value}</div>
        </Card>
      ))}
    </div>
  );
}

function StudentsPanel() {
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["students", gradeFilter],
    queryFn: async () => {
      let q = supabase
        .from("profiles")
        .select("id,email,full_name,grade,country,created_at")
        .order("created_at", { ascending: false });
      if (gradeFilter !== "all") q = q.eq("grade", Number(gradeFilter));
      const { data, error } = await q;
      if (error) throw error;
      // exclude teacher rows
      const rolesRes = await supabase.from("user_roles").select("user_id,role");
      const studentIds = new Set(
        (rolesRes.data ?? []).filter((r) => r.role === "student").map((r) => r.user_id),
      );
      return (data ?? []).filter((p) => studentIds.has(p.id));
    },
  });

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">All students</h2>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Grade</Label>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {GRADES.map((g) => <SelectItem key={g} value={String(g)}>Class {g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
            ) : (data?.length ?? 0) === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-muted-foreground">No students yet. Send an invite to get started.</TableCell></TableRow>
            ) : data!.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.full_name ?? "—"}</TableCell>
                <TableCell>{p.email}</TableCell>
                <TableCell>{p.grade ? `Class ${p.grade}` : "—"}</TableCell>
                <TableCell>{p.country ?? "—"}</TableCell>
                <TableCell>{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function InvitesPanel() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState({ email: "", full_name: "", grade: "5", country: "India" });

  const { data, isLoading } = useQuery({
    queryKey: ["invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createInvite = useMutation({
    mutationFn: async () => {
      if (!form.email) throw new Error("Email required");
      const email = form.email.trim().toLowerCase();
      const { data, error } = await supabase
        .from("invites")
        .insert({
          email,
          full_name: form.full_name || null,
          grade: Number(form.grade),
          country: form.country,
          invited_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Send the password-setup email via Supabase admin invite.
      const { sendStudentInvite } = await import("@/lib/invites.functions");
      await sendStudentInvite({
        data: {
          email,
          fullName: form.full_name || null,
          redirectTo: `${window.location.origin}/reset-password`,
        },
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Invite sent — student will receive a password setup email");
      setForm({ email: "", full_name: "", grade: "5", country: "India" });
      qc.invalidateQueries({ queryKey: ["invites"] });
      qc.invalidateQueries({ queryKey: ["teacher-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invites").update({ status: "revoked" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invite revoked");
      qc.invalidateQueries({ queryKey: ["invites"] });
    },
  });

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  };

  const mailto = (invite: NonNullable<typeof data>[number]) => {
    const url = `${window.location.origin}/invite/${invite.token}`;
    const subject = encodeURIComponent("Your MathNest invitation");
    const body = encodeURIComponent(
      `Hi${invite.full_name ? " " + invite.full_name : ""},\n\nYou've been invited to join MathNest for Class ${invite.grade} math tuition.\n\nClick to accept: ${url}\n\nSign in with this Google account: ${invite.email}\n\nSee you in class!\nNisha`,
    );
    window.location.href = `mailto:${invite.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <Card className="p-5">
        <h2 className="text-lg font-semibold">Send an invite</h2>
        <p className="text-sm text-muted-foreground">
          The student will receive an email with a link to set their password.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="student@example.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="name">Full name (optional)</Label>
            <Input id="name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
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
              <Label>Country</Label>
              <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full" disabled={createInvite.isPending} onClick={() => createInvite.mutate()}>
            <Send className="mr-2 h-4 w-4" />
            {createInvite.isPending ? "Creating…" : "Create invite"}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold">All invites</h2>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>
              ) : (data?.length ?? 0) === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-muted-foreground">No invites yet.</TableCell></TableRow>
              ) : data!.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.email}</TableCell>
                  <TableCell>Class {i.grade}</TableCell>
                  <TableCell>
                    <span className={
                      "rounded-full px-2 py-0.5 text-xs font-medium " +
                      (i.status === "accepted" ? "bg-primary/15 text-primary"
                        : i.status === "pending" ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground")
                    }>{i.status}</span>
                  </TableCell>
                  <TableCell>{format(new Date(i.created_at), "MMM d")}</TableCell>
                  <TableCell className="text-right">
                    {i.status === "pending" && (
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => copyLink(i.token)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => mailto(i)}>
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => revoke.mutate(i.id)}>
                          Revoke
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

