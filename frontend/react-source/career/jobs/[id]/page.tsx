"use client";
import { useUser } from "@/lib/user";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { AppHeader } from "@/components/app-header";
import { JobDetailPage } from "@/components/career/job-detail/JobDetailPage";

export default function JobDetailRoute() {
  const { user } = useUser();
  const params = useParams<{ id: string }>();
  return (
    <RequireAuth>
      <AppHeader
        userImage={user?.picture ?? ""}
        userName={user?.name ?? ""}
        initials={(user?.name ?? "?").charAt(0).toUpperCase()}
      />
      <JobDetailPage jobId={params.id} />
    </RequireAuth>
  );
}
