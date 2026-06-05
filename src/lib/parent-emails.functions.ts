import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const SendSchema = z.object({
  studentId: z.string().uuid(),
  type: z.enum(["score_alert", "one_to_one_request"]),
  worksheetTitle: z.string().min(1).max(255).optional(),
  percentage: z.number().min(0).max(100).optional(),
});

async function ensureTeacher(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "teacher").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Only teachers can send parent emails");
}

export const sendParentEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SendSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureTeacher(supabase, userId);

    // Cooldown check (24h)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from("parent_notifications")
      .select("id")
      .eq("student_id", data.studentId)
      .eq("notification_type", data.type)
      .gte("sent_at", since)
      .limit(1);
    if (recent && recent.length > 0) {
      throw new Error("Already sent within last 24 hours");
    }

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("full_name, parent_name, parent_email")
      .eq("id", data.studentId)
      .single();
    if (pErr) throw new Error(pErr.message);
    if (!profile?.parent_email) throw new Error("Parent email missing on profile");

    const studentName = profile.full_name ?? "your child";
    const parentName = profile.parent_name ?? "there";

    let subject: string;
    let body: string;
    if (data.type === "score_alert") {
      const pct = data.percentage ?? 0;
      const ws = data.worksheetTitle ?? "a worksheet";
      subject = `MathNest — Worksheet score update for ${studentName}`;
      body = `Hi ${parentName},\n\n${studentName} scored ${pct}% on their recent worksheet — ${ws}.\n\nWe'd love to help them improve. Please get in touch with Nisha on WhatsApp at +917589143825.\n\n— MathNest`;
    } else {
      subject = `MathNest — 1:1 session recommended for ${studentName}`;
      body = `Hi ${parentName},\n\n${studentName} has scored below 80% in 5 or more worksheets. A weekly 1:1 session could really help strengthen their skills.\n\nPlease reach out to Nisha on WhatsApp at +917589143825 to get started.\n\n— MathNest`;
    }

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      console.error("[parent-email] Missing API keys");
      return { ok: false };
    }

    try {
      const res = await fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: "MathNest <onboarding@resend.dev>",
          to: [profile.parent_email],
          subject,
          text: body,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error("[parent-email] Resend failed", res.status, txt);
      }
    } catch (e) {
      console.error("[parent-email] Resend error", e);
    }

    // Log notification regardless (per spec: fail silently on email errors,
    // but record send attempt for cooldown).
    await supabaseAdmin.from("parent_notifications").insert({
      student_id: data.studentId,
      notification_type: data.type,
      sent_by: userId,
    });

    return { ok: true };
  });
