"use client";
import { useUser } from "@/lib/user";
import { RequireAuth } from "@/components/RequireAuth";
import { TemplatesPage } from "@/components/inbox/templates/TemplatesPage";

export default function TemplatesRoute() {
  const { user } = useUser();
  return (
    <RequireAuth>
      <TemplatesPage userName={user?.name ?? ""} userImage={user?.picture ?? ""} />
    </RequireAuth>
  );
}
