"use client";
import { useUser } from "@/lib/user";
import { RequireAuth } from "@/components/RequireAuth";
import { RoutesPage } from "@/components/routes/RoutesPage";
import { RequireApiKeys } from "@/components/RequireApiKeys";
import { BackBar } from "@/components/BackBar";

export default function RoutesRoute() {
  const { user } = useUser();
  return (
    <RequireAuth>
      <BackBar />
      <RequireApiKeys>
        <RoutesPage userName={user?.name ?? ""} userImage={user?.picture ?? ""} />
      </RequireApiKeys>
    </RequireAuth>
  );
}
