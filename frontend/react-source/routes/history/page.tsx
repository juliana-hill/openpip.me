"use client";
import { useUser } from "@/lib/user";
import { RequireAuth } from "@/components/RequireAuth";
import { RoutesPage } from "@/components/routes/RoutesPage";

export default function RoutesHistoryPage() {
  const { user } = useUser();
  return (
    <RequireAuth>
      <RoutesPage userName={user?.name ?? ""} userImage={user?.picture ?? ""} showHistory />
    </RequireAuth>
  );
}
