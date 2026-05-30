import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function StudentResultsPanel() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["all-student-results"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("student_results") as any)
        .select("id,student_name,worksheet_title,drive_url,submitted_at")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string;
        student_name: string | null;
        worksheet_title: string | null;
        drive_url: string;
        submitted_at: string;
      }>;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = data ?? [];
    if (!q) return list;
    return list.filter(
      (r) =>
        (r.student_name ?? "").toLowerCase().includes(q) ||
        (r.worksheet_title ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const view = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("student-results")
      .createSignedUrl(path, 60 * 10);
    if (error || !data) return toast.error("Could not open file");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Student Results</h2>
          <Badge variant="secondary">{data?.length ?? 0}</Badge>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by student or worksheet"
            className="w-72 pl-8"
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Worksheet Title</TableHead>
              <TableHead>Submitted On</TableHead>
              <TableHead className="text-right">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-muted-foreground">No submissions yet.</TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.student_name ?? "—"}</TableCell>
                <TableCell>{r.worksheet_title ?? "—"}</TableCell>
                <TableCell>{format(new Date(r.submitted_at), "MMM d, yyyy h:mm a")}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => view(r.drive_url)}>
                    <ExternalLink className="mr-1.5 h-4 w-4" /> View Result
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
