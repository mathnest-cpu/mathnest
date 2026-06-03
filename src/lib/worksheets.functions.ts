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
};

export const listMyWorksheets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StudentWorksheet[]> => {
    const { supabase, userId } = context;

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("grade, plan")
      .eq("id", userId)
      .single();
    if (pErr) throw new Error(pErr.message);
    if (!profile?.grade) return [];

    // Use admin to fetch metadata for ALL worksheets for the student's class,
    // so we can render locked cards. URL is stripped for locked rows.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("worksheets")
      .select("id,title,description,topic,created_at,is_free_tier,notion_url,assigned_grades")
      .contains("assigned_grades", [profile.grade])
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const isPaid = profile.plan === "paid";
    return (data ?? []).map((w) => {
      const locked = !isPaid && !w.is_free_tier;
      return {
        id: w.id,
        title: w.title,
        description: w.description,
        topic: w.topic,
        created_at: w.created_at,
        is_free_tier: !!w.is_free_tier,
        notion_url: locked ? null : w.notion_url,
        locked,
      };
    });
  });
