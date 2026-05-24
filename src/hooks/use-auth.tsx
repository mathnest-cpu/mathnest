import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "teacher" | "student";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) {
        setRole(null);
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const userEmail = session.user.email?.toLowerCase();
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (userEmail === "nisha.ssc.salhotra@gmail.com") {
          setRole("teacher");
        } else if (error) {
          setRole(null);
        } else {
          setRole((data?.role as Role) ?? null);
        }
        setLoading(false);
      });
  }, [session?.user?.id]);

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
