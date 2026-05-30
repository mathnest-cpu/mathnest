import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";

const GRADES = [3, 4, 5, 6, 7, 8, 9, 10];
const classLabel = (g: number) => `Class ${g}`;

type WorksheetForm = {
  title: string;
  description: string;
  notion_url: string;
  topic: string;
  assigned_grades: number[];
};

const emptyForm: WorksheetForm = {
  title: "",
  description: "",
  notion_url: "",
  topic: "",
  assigned_grades: [],
};

export function WorksheetsPanel() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState<WorksheetForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<WorksheetForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["worksheets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worksheets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Title is required");
      if (!form.notion_url.trim()) throw new Error("Worksheet URL is required");
      if (form.assigned_grades.length === 0) throw new Error("Assign at least one class");
      const { error } = await supabase.from("worksheets").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        notion_url: form.notion_url.trim(),
        topic: form.topic.trim() || null,
        assigned_grades: form.assigned_grades,
        uploaded_by: user!.id,
        // legacy required-ish fields kept as placeholders
        storage_path: null,
        file_name: null,
        grade: form.assigned_grades[0],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Worksheet added");
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["worksheets"] });
      qc.invalidateQueries({ queryKey: ["teacher-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      if (!editForm.title.trim()) throw new Error("Title is required");
      if (!editForm.notion_url.trim()) throw new Error("Worksheet URL is required");
      if (editForm.assigned_grades.length === 0) throw new Error("Assign at least one class");
      const { error } = await supabase
        .from("worksheets")
        .update({
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          notion_url: editForm.notion_url.trim(),
          topic: editForm.topic.trim() || null,
          assigned_grades: editForm.assigned_grades,
        })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Worksheet updated");
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["worksheets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("worksheets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Worksheet deleted");
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["worksheets"] });
      qc.invalidateQueries({ queryKey: ["teacher-overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((w) => {
      if (classFilter !== "all") {
        const g = Number(classFilter);
        if (!(w.assigned_grades ?? []).includes(g)) return false;
      }
      if (!q) return true;
      return (
        w.title.toLowerCase().includes(q) ||
        (w.topic ?? "").toLowerCase().includes(q) ||
        (w.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, search, classFilter]);

  const testLink = (url: string) => {
    if (!url.trim()) return toast.error("Paste a link first");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const startEdit = (w: NonNullable<typeof data>[number]) => {
    setEditingId(w.id);
    setEditForm({
      title: w.title,
      description: w.description ?? "",
      notion_url: w.notion_url ?? "",
      topic: w.topic ?? "",
      assigned_grades: w.assigned_grades ?? [],
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card className="p-5">
        <h2 className="text-lg font-semibold">Add worksheet</h2>
        <p className="text-sm text-muted-foreground">Paste a worksheet link and assign it to one or more classes.</p>
        <div className="mt-4 space-y-3">
          <div>
            <Label>Worksheet title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Fractions practice set 1" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short note for students" />
          </div>
          <div>
            <Label>Worksheet URL (GitHub Pages)</Label>
            <div className="flex gap-2">
              <Input value={form.notion_url} onChange={(e) => setForm({ ...form, notion_url: e.target.value })} placeholder="https://yourusername.github.io/mathnest-worksheets/" />
              <Button type="button" variant="outline" onClick={() => testLink(form.notion_url)}>Test</Button>
            </div>
          </div>
          <div>
            <Label>Topic / tag (optional)</Label>
            <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Fractions" />
          </div>
          <div>
            <Label>Assign to classes</Label>
            <ClassPicker value={form.assigned_grades} onChange={(v) => setForm({ ...form, assigned_grades: v })} />
          </div>
          <Button className="w-full" disabled={create.isPending} onClick={() => create.mutate()}>
            <Plus className="mr-2 h-4 w-4" />
            {create.isPending ? "Adding…" : "Add worksheet"}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">All worksheets</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or topic" className="w-56 pl-8" />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {GRADES.map((g) => <SelectItem key={g} value={String(g)}>{classLabel(g)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {isLoading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              No worksheets yet — add your first one on the left.
            </div>
          ) : filtered.map((w) => (
            <div key={w.id} className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{w.title}</div>
                  {w.description && <div className="mt-0.5 text-sm text-muted-foreground">{w.description}</div>}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {(w.assigned_grades ?? []).map((g) => (
                      <Badge key={g} variant="secondary">{classLabel(g)}</Badge>
                    ))}
                    {w.topic && <Badge variant="outline">{w.topic}</Badge>}
                    <span className="text-xs text-muted-foreground">· Added {format(new Date(w.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {w.notion_url && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => window.open(w.notion_url!, "_blank", "noopener,noreferrer")}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => copyLink(w.notion_url!)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => startEdit(w)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(w.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={!!editingId} onOpenChange={(o) => !o && setEditingId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit worksheet</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div>
              <Label>Worksheet URL (GitHub Pages)</Label>
              <div className="flex gap-2">
                <Input value={editForm.notion_url} onChange={(e) => setEditForm({ ...editForm, notion_url: e.target.value })} placeholder="https://yourusername.github.io/mathnest-worksheets/" />
                <Button type="button" variant="outline" onClick={() => testLink(editForm.notion_url)}>Test</Button>
              </div>
            </div>
            <div>
              <Label>Topic / tag</Label>
              <Input value={editForm.topic} onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })} />
            </div>
            <div>
              <Label>Assign to classes</Label>
              <ClassPicker value={editForm.assigned_grades} onChange={(v) => setEditForm({ ...editForm, assigned_grades: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button disabled={update.isPending} onClick={() => update.mutate()}>
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this worksheet?</AlertDialogTitle>
            <AlertDialogDescription>Students assigned to this worksheet will no longer see it. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && remove.mutate(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ClassPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const toggle = (g: number) => {
    onChange(value.includes(g) ? value.filter((x) => x !== g) : [...value, g].sort((a, b) => a - b));
  };
  return (
    <div className="flex flex-wrap gap-2 rounded-md border bg-background p-2">
      {GRADES.map((g) => {
        const active = value.includes(g);
        return (
          <button
            key={g}
            type="button"
            onClick={() => toggle(g)}
            className={
              "rounded-full px-3 py-1 text-xs font-medium transition-colors " +
              (active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground")
            }
          >
            {classLabel(g)}
          </button>
        );
      })}
    </div>
  );
}
