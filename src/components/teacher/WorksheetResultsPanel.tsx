import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, differenceInHours } from "date-fns";

type Row = {
  id: string;
  student_name: string;
  student_email: string;
  worksheet_title: string;
  worksheet_class: string;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
};

const CLASSES = ["Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];

function statusFor(pct: number) {
  if (pct >= 80) return { label: "Pass", text: "text-emerald-700", ring: "bg-emerald-100" };
  if (pct >= 50) return { label: "Review", text: "text-amber-700", ring: "bg-amber-100" };
  return { label: "Needs work", text: "text-red-700", ring: "bg-red-100" };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function WorksheetResultsPanel() {
  const [studentQ, setStudentQ] = useState("");
  const [worksheetQ, setWorksheetQ] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["all-worksheet-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worksheet_results" as any)
        .select("id,student_name,student_email,worksheet_title,worksheet_class,score,total_questions,percentage,completed_at")
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    const sq = studentQ.trim().toLowerCase();
    const wq = worksheetQ.trim().toLowerCase();
    return list.filter((r) => {
      if (sq && !r.student_name.toLowerCase().includes(sq)) return false;
      if (wq && !r.worksheet_title.toLowerCase().includes(wq)) return false;
      if (classFilter !== "all" && r.worksheet_class !== classFilter) return false;
      if (statusFilter !== "all" && statusFor(r.percentage).label !== statusFilter) return false;
      return true;
    });
  }, [data, studentQ, worksheetQ, classFilter, statusFilter]);

  const stats = useMemo(() => {
    const list = data ?? [];
    const total = list.length;
    const avg = total === 0 ? 0 : Math.round(list.reduce((s, r) => s + r.percentage, 0) / total);
    const below = list.filter((r) => r.percentage < 80).length;
    const perfect = list.filter((r) => r.percentage === 100).length;
    return { total, avg, below, perfect };
  }, [data]);

  const cards = [
    { label: "Total submissions", value: stats.total },
    { label: "Average score", value: `${stats.avg}%` },
    { label: "Below 80%", value: stats.below },
    { label: "Perfect scores", value: stats.perfect },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="text-sm text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-2xl font-bold">{c.value}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Student Results</h2>
            <Badge variant="secondary">{filtered.length}</Badge>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder="Filter by student name" value={studentQ} onChange={(e) => setStudentQ(e.target.value)} />
          <Input placeholder="Filter by worksheet name" value={worksheetQ} onChange={(e) => setWorksheetQ(e.target.value)} />
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Pass">Pass</SelectItem>
              <SelectItem value="Review">Review</SelectItem>
              <SelectItem value="Needs work">Needs work</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Worksheet Name</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Pct</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7}>Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-muted-foreground">No submissions match the current filters.</TableCell></TableRow>
              ) : filtered.map((r) => {
                const s = statusFor(r.percentage);
                const isNew = differenceInHours(new Date(), new Date(r.completed_at)) < 24;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                          {initials(r.student_name)}
                        </div>
                        <span className="font-medium">{r.student_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{r.worksheet_class}</TableCell>
                    <TableCell>{r.worksheet_title}</TableCell>
                    <TableCell>{r.score} / {r.total_questions}</TableCell>
                    <TableCell>{r.percentage}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{format(new Date(r.completed_at), "dd MMM yyyy")}</span>
                        {isNew && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">New</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.ring} ${s.text}`}>{s.label}</span>
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
