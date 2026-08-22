"use client";
import { useUser } from "@/lib/user";
import { RequireAuth } from "@/components/RequireAuth";
import { TasksDashboard } from "@/components/tasks/TasksDashboard";
import { RequireApiKeys } from "@/components/RequireApiKeys";
import { BackBar } from "@/components/BackBar";

export default function TasksPage() {
  const { user } = useUser();
  return (
    <RequireAuth>
      <BackBar />
      <RequireApiKeys>
        <TasksDashboard userName={user?.name ?? ""} userImage={user?.picture ?? ""} />
      </RequireApiKeys>
    </RequireAuth>
  );
}
