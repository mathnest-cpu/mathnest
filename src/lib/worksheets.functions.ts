import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type StudentWorksheet = {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
  created_at: string;
  is_free_tier: boolean;
  /** Only present when the student is allowed to open this worksheet. */
  notion_url: string | null;
  locked: boolean;
  /** Why is it locked. */
  lock_reason: "none" | "paid" | "progress";
  /** Previous worksheet title (when locked by progress). */
  prev_title: string | null;
  /** Student's score on this worksheet, if completed. */
  completed_percentage: number | null;
};

export const listMyWorksheets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StudentWorksheet[]> => {
    const { supabase, userId } = context;

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("grade, plan, email")
      .eq("id", userId)
      .single();
    if (pErr) throw new Error(pErr.message);
    if (!profile?.grade) return [];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("worksheets")
      .select("id,title,description,topic,created_at,is_free_tier,notion_url,assigned_grades")
      .contains("assigned_grades", [profile.grade])
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    // Fetch this student's results by email match
    const { data: results } = await supabaseAdmin
      .from("worksheet_results" as any)
      .select("worksheet_title, percentage, completed_at")
      .ilike("student_email", profile.email ?? "");
    const byTitle = new Map<string, number>();
    for (const r of (results ?? []) as unknown as Array<{ worksheet_title: string; percentage: number }>) {
      const existing = byTitle.get(r.worksheet_title);
      if (existing == null || r.percentage > existing) byTitle.set(r.worksheet_title, r.percentage);
    }

    const isPaid = profile.plan === "paid";
    const list = data ?? [];

    return list.map((w, idx) => {
      const completed = byTitle.get(w.title) ?? null;
      const prev = idx > 0 ? list[idx - 1] : null;
      const prevCompleted = prev ? byTitle.has(prev.title) : true;

      // Lock rules
      let locked = false;
      let lock_reason: StudentWorksheet["lock_reason"] = "none";
      if (!isPaid && !w.is_free_tier) {
        locked = true; lock_reason = "paid";
      } else if (idx > 0 && !prevCompleted) {
        locked = true; lock_reason = "progress";
      }

      return {
        id: w.id,
        title: w.title,
        description: w.description,
        topic: w.topic,
        created_at: w.created_at,
        is_free_tier: !!w.is_free_tier,
        notion_url: locked ? null : w.notion_url,
        locked,
        lock_reason,
        prev_title: prev?.title ?? null,
        completed_percentage: completed,
      };
    });
  });
