"use client";
import { useUser } from "@/lib/user";
import { RequireAuth } from "@/components/RequireAuth";
import { DashboardPage } from "@/components/dashboard/DashboardPage";

export default function Home() {
  const { user } = useUser();
  return (
    <RequireAuth>
      <DashboardPage userName={user?.name ?? ""} userImage={user?.picture ?? ""} />
    </RequireAuth>
  );
}
