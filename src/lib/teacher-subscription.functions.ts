import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SetPlanInput = {
  studentId: string;
  plan: "paid" | "free";
  months?: number; // for paid: how many months of access from now (default 1)
};

function validate(input: unknown): SetPlanInput {
  const v = input as SetPlanInput;
  if (!v || typeof v.studentId !== "string" || !v.studentId) {
    throw new Error("studentId required");
  }
  if (v.plan !== "paid" && v.plan !== "free") {
    throw new Error("plan must be 'paid' or 'free'");
  }
  const months = v.months ?? 1;
  if (!Number.isFinite(months) || months < 1 || months > 36) {
    throw new Error("months must be between 1 and 36");
  }
  return { studentId: v.studentId, plan: v.plan, months };
}

export const setStudentPlanManually = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Authorize: caller must be a teacher
    const { data: isTeacher, error: roleErr } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: boolean | null; error: { message: string } | null }>)(
      "has_role",
      { _user_id: userId, _role: "teacher" },
    );
    if (roleErr) throw new Error(roleErr.message);
    if (!isTeacher) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: {
      plan: "paid" | "free";
      plan_status: string;
      billing_cycle_end: string | null;
      subscription_id?: string | null;
    } = data.plan === "paid"
      ? {
          plan: "paid",
          plan_status: "active",
          billing_cycle_end: new Date(
            Date.now() + (data.months ?? 1) * 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        }
      : {
          plan: "free",
          plan_status: "active",
          billing_cycle_end: null,
          subscription_id: null,
        };

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(patch)
      .eq("id", data.studentId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
