"use client";
import { useEffect } from "react";
import { useUser } from "@/lib/user";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [loading, user]);

  if (loading || !user) return null;
  return <>{children}</>;
}
