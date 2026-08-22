"use client";
import { useUser } from "@/lib/user";
import { RequireAuth } from "@/components/RequireAuth";
import { CampaignsPage } from "@/components/inbox/campaigns/CampaignsPage";

export default function CampaignsRoute() {
  const { user } = useUser();
  return (
    <RequireAuth>
      <CampaignsPage userName={user?.name ?? ""} userImage={user?.picture ?? ""} />
    </RequireAuth>
  );
}
