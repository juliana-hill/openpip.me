"use client";
import { useUser } from "@/lib/user";
import { RequireAuth } from "@/components/RequireAuth";
import { CareerDashboard } from "@/components/career/CareerDashboard";
import { RequireApiKeys } from "@/components/RequireApiKeys";

export default function CareerHistoryPage() {
  const { user } = useUser();
  return (
    <RequireAuth>
      <RequireApiKeys>
        <CareerDashboard userName={user?.name ?? ""} userImage={user?.picture ?? ""} showHistory />
      </RequireApiKeys>
    </RequireAuth>
  );
}
