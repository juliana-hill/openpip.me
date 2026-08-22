"use client";

import { RequireAuth } from "@/components/RequireAuth";
import { ReviewDetailPage } from "@/components/review/ReviewDetailPage";
import { useUser } from "@/lib/user";

export default function ReviewItemPage() {
  const { user } = useUser();
  return <RequireAuth><ReviewDetailPage userName={user?.name ?? ""} userImage={user?.picture ?? ""} /></RequireAuth>;
}
