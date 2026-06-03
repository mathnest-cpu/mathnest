import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ExternalLink, Lock, Search, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { safeHttpUrl } from "@/lib/safe-url";
import { listMyWorksheets } from "@/lib/worksheets.functions";
import { SubscribeButton } from "@/components/SubscribeButton";

export function StudentWorksheets() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showUpgradeFor, setShowUpgradeFor] = useState<string | null>(null);
  const fetchList = useServerFn(listMyWorksheets);

  const { data, isLoading } = useQuery({
    queryKey: ["my-worksheets", user?.id],
    enabled: !!user,
    queryFn: () => fetchList(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = data ?? [];
    if (!q) return list;
    return list.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        (w.topic ?? "").toLowerCase().includes(q) ||
        (w.description ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Your worksheets</h2>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or topic" className="w-64 pl-8" />
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">All worksheets assigned to your class.</p>

      <div className="mt-4 grid gap-3">
        {isLoading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No worksheets yet — check back soon! 📚
          </div>
        ) : filtered.map((w) => {
          const safe = safeHttpUrl(w.notion_url);
          const locked = w.locked;
          return (
            <div
              key={w.id}
              className={
                "rounded-xl border bg-card p-4 shadow-[var(--shadow-card)] transition-opacity " +
                (locked ? "opacity-60" : "")
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    {locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                    {w.title}
                  </div>
                  {w.description && <div className="mt-0.5 text-sm text-muted-foreground">{w.description}</div>}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {w.is_free_tier ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600">Free</Badge>
                    ) : (
                      <Badge variant={locked ? "outline" : "secondary"}>Paid</Badge>
                    )}
                    {w.topic && <Badge variant="secondary">{w.topic}</Badge>}
                    <span className="text-xs text-muted-foreground">Added {format(new Date(w.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
                {locked ? (
                  <Button size="sm" variant="outline" onClick={() => setShowUpgradeFor(showUpgradeFor === w.id ? null : w.id)}>
                    <Lock className="mr-2 h-4 w-4" /> Locked
                  </Button>
                ) : safe ? (
                  <Button size="sm" onClick={() => window.open(safe, "_blank", "noopener,noreferrer")}>
                    <ExternalLink className="mr-2 h-4 w-4" /> Open Worksheet
                  </Button>
                ) : null}
              </div>
              {locked && showUpgradeFor === w.id && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700/40 dark:bg-amber-950/30">
                  <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-600" /> Upgrade to ₹299/month to unlock this worksheet.</span>
                  <SubscribeButton label="Upgrade" size="sm" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
