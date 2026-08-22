"use client";
import { useUser } from "@/lib/user";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireApiKeys } from "@/components/RequireApiKeys";
import { AppHeader } from "@/components/app-header";
import { ContactsBoard } from "@/components/career/ContactsBoard";
import { PageShell } from "@/components/ui/PageShell";

export default function NetworkPage() {
  const { user } = useUser();
  const userName = user?.name ?? "";
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <RequireAuth>
      <AppHeader userImage={user?.picture ?? ""} userName={userName} initials={initials} pageTitle="Networking" />
      <RequireApiKeys>
        <PageShell>
          <ContactsBoard />
        </PageShell>
      </RequireApiKeys>
    </RequireAuth>
  );
}
