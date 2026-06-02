import { createServerFn } from "@tanstack/react-start";
import { getRequestHost, getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const InviteSchema = z.object({
  email: z.string().email().max(255),
  fullName: z.string().min(1).max(255).optional().nullable(),
  redirectTo: z.string().url(),
});

/**
 * Sends a Supabase invite email (with a link to set a password) to the
 * student. The caller must be authenticated as a teacher.
 */
export const sendStudentInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InviteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Restrict redirectTo to the app's own origin to prevent the invite
    // email from carrying a link to an attacker-controlled site.
    const siteUrl = process.env.SITE_URL ?? process.env.VITE_SITE_URL;
    if (siteUrl) {
      try {
        const allowed = new URL(siteUrl).origin;
        const target = new URL(data.redirectTo).origin;
        if (target !== allowed) {
          throw new Error("redirectTo must match the app origin");
        }
      } catch {
        throw new Error("Invalid redirectTo");
      }
    }

    // Verify the caller is a teacher (RLS-respecting client).
    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "teacher")
      .maybeSingle();
    if (roleErr) throw new Error(roleErr.message);
    if (!roleRow) throw new Error("Only teachers can send invites");

    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: data.redirectTo,
      data: data.fullName ? { full_name: data.fullName } : undefined,
    });
    if (error) {
      // If the user already exists, fall back to a password-reset link so
      // they can still receive an email and set a fresh password.
      if (/already/i.test(error.message)) {
        const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(
          data.email,
          { redirectTo: data.redirectTo },
        );
        if (resetErr) throw new Error(resetErr.message);
        return { ok: true, mode: "reset" as const };
      }
      throw new Error(error.message);
    }
    return { ok: true, mode: "invite" as const };
  });
