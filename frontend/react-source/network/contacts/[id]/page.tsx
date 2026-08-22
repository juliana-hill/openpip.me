"use client";

import { use } from "react";
import { useUser } from "@/lib/user";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireApiKeys } from "@/components/RequireApiKeys";
import { AppHeader } from "@/components/app-header";
import { ContactDetailPage } from "@/components/network/contact-detail/ContactDetailPage";

export default function ContactDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const userName = user?.name ?? "";
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <RequireAuth>
      <AppHeader userImage={user?.picture ?? ""} userName={userName} initials={initials} pageTitle="Contact" />
      <RequireApiKeys>
        <ContactDetailPage contactId={id} />
      </RequireApiKeys>
    </RequireAuth>
  );
}
