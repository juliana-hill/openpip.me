import Link from "next/link";
import { AssistantPreferencesForm } from "@/components/settings/AssistantPreferencesForm";
import { ConnectorStatus } from "@/components/settings/ConnectorStatus";
import { WorkingContextForm } from "@/components/settings/WorkingContextForm";

export default function SettingsPage() {
  return (
    <main className="app-shell settings-page">
      <Link href="/" className="back-link">← Today</Link>
      <header className="settings-header">
        <p className="eyebrow">Settings</p>
        <h1>Make OpenPip feel like your assistant.</h1>
      </header>
      <AssistantPreferencesForm />
      <ConnectorStatus />
      <WorkingContextForm />
    </main>
  );
}
