"use client";
import { useUser } from "@/lib/user";
import { RequireAuth } from "@/components/RequireAuth";
import { NotebookDashboard } from "@/components/notebook/NotebookDashboard";
import { BackBar } from "@/components/BackBar";

export default function NotebookPage() {
  const { user } = useUser();
  return (
    <RequireAuth>
      <BackBar />
      <NotebookDashboard userName={user?.name ?? ""} userImage={user?.picture ?? ""} />
    </RequireAuth>
  );
}
