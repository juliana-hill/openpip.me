"use client";
import { useUser } from "@/lib/user";
import { RequireAuth } from "@/components/RequireAuth";
import { CareerDashboard } from "@/components/career/CareerDashboard";
import { RequireApiKeys } from "@/components/RequireApiKeys";
import { BackBar } from "@/components/BackBar";

export default function CareerPage() {
  const { user } = useUser();
  return (
    <RequireAuth>
      <BackBar />
      <RequireApiKeys>
        <CareerDashboard userName={user?.name ?? ""} userImage={user?.picture ?? ""} />
      </RequireApiKeys>
    </RequireAuth>
  );
}
