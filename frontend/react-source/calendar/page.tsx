"use client";
import { useUser } from "@/lib/user";
import { RequireAuth } from "@/components/RequireAuth";
import { CalendarPage } from "@/components/calendar/CalendarPage";
import { BackBar } from "@/components/BackBar";

export default function CalendarRoute() {
  const { user } = useUser();
  return (
    <RequireAuth>
      <BackBar />
      <CalendarPage userName={user?.name ?? ""} userImage={user?.picture ?? ""} />
    </RequireAuth>
  );
}
