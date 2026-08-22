"use client";
import { useUser } from "@/lib/user";
import { RequireAuth } from "@/components/RequireAuth";
import { SettingsPage } from "@/components/settings/SettingsPage";

export default function Settings() {
  const { user } = useUser();
  return (
    <RequireAuth>
      <SettingsPage
        userEmail={user?.email ?? ""}
        userName={user?.name ?? ""}
        userImage={user?.picture ?? ""}
      />
    </RequireAuth>
  );
}
