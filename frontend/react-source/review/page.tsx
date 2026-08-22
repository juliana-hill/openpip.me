"use client";

import { RequireAuth } from "@/components/RequireAuth";
import { ReviewQueuePage } from "@/components/review/ReviewQueuePage";
import { useUser } from "@/lib/user";

export default function ReviewPage() {
  const { user } = useUser();
  return <RequireAuth><ReviewQueuePage userName={user?.name ?? ""} userImage={user?.picture ?? ""} /></RequireAuth>;
}
