"use client";
import { useUser } from "@/lib/user";
import { RequireAuth } from "@/components/RequireAuth";
import { InboxPage } from "@/components/inbox/InboxPage";
import { BackBar } from "@/components/BackBar";

export default function InboxRoute() {
  const { user } = useUser();
  return (
    <RequireAuth>
      <BackBar />
      <InboxPage userName={user?.name ?? ""} userImage={user?.picture ?? ""} />
    </RequireAuth>
  );
}
