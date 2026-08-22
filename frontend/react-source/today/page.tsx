"use client";

import { RequireAuth } from "@/components/RequireAuth";
import { TodayPage } from "@/components/dashboard/TodayPage";
import { useUser } from "@/lib/user";

export default function TodayRoute() {
  const { user } = useUser();
  return <RequireAuth><TodayPage userName={user?.name ?? ""} userImage={user?.picture ?? ""} /></RequireAuth>;
}
