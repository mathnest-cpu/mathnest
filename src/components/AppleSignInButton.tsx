import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

export function AppleSignInButton({ label = "Continue with Apple" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Sign-in failed", { description: result.error.message });
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <Button onClick={handle} disabled={loading} size="lg" className="w-full gap-3 bg-black text-white hover:bg-black/90">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.365 1.43c0 1.14-.49 2.23-1.27 3.02-.85.86-2.23 1.52-3.36 1.43-.13-1.1.42-2.24 1.18-3.01.85-.88 2.3-1.52 3.45-1.44zM20.5 17.34c-.55 1.27-.82 1.84-1.53 2.96-.99 1.56-2.39 3.51-4.12 3.52-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.06-1.78-4.05-3.34-2.77-4.36-3.06-9.48-1.35-12.2 1.21-1.93 3.13-3.07 4.93-3.07 1.84 0 2.99 1.01 4.51 1.01 1.47 0 2.37-1.01 4.49-1.01 1.61 0 3.31.88 4.53 2.39-3.98 2.18-3.33 7.85.69 9.74z"/>
      </svg>
      {loading ? "Signing in…" : label}
    </Button>
  );
}
