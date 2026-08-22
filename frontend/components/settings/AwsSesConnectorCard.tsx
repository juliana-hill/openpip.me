"use client";
import { proxyFetch } from "@/lib/proxy";
import { useState } from "react";
import { ConnectorCard } from "./ConnectorCard";
import dialogStyles from "@/components/ui/Dialog.module.css";
import inputStyles from "@/components/ui/Input.module.css";
import btnStyles from "@/components/ui/Button.module.css";
import { Mail } from "lucide-react";

type Form = {
  label: string;
  accessKeyId: string;
  secretAccessKey: string;
  s3Bucket: string;
  region: string;
  sesRegion: string;
  sesFromEmail: string;
  sesFromAddresses: string[];
  localEmailsPath: string;
};

export type EmailAccountSummary = {
  id: string;
  label: string;
  hasCredentials: boolean;
  s3Bucket: string;
  region: string;
  sesRegion: string;
  sesFromEmail: string;
  sesFromAddresses?: string[];
  localEmailsPath: string;
};

type Props = {
  account: EmailAccountSummary;
  onSaved: (updated: EmailAccountSummary) => void;
  onRemoved: (id: string) => void;
};

export function AwsSesConnectorCard({ account, onSaved, onRemoved }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Form>({
    label: account?.label ?? "",
    accessKeyId: "",
    secretAccessKey: "",
    s3Bucket: account?.s3Bucket ?? "",
    region: account?.region ?? "us-east-1",
    sesRegion: account?.sesRegion ?? "us-east-1",
    sesFromEmail: account?.sesFromEmail ?? "",
    sesFromAddresses: account?.sesFromAddresses ?? (account?.sesFromEmail ? [account.sesFromEmail] : [""]),
    localEmailsPath: account?.localEmailsPath ?? "data/emails",
  });

  // Re-sync form when dialog opens (account prop may have updated)
  const openDialog = () => {
    setForm({
      label: account?.label ?? "",
      accessKeyId: "",
      secretAccessKey: "",
      s3Bucket: account?.s3Bucket ?? "",
      region: account?.region ?? "us-east-1",
      sesRegion: account?.sesRegion ?? "us-east-1",
      sesFromEmail: account?.sesFromEmail ?? "",
      sesFromAddresses: account?.sesFromAddresses ?? (account?.sesFromEmail ? [account.sesFromEmail] : [""]),
      localEmailsPath: account?.localEmailsPath ?? "data/emails",
    });
    setDialogOpen(true);
  };
  if (!account) return null;
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof Form, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await proxyFetch(`/agent/inbox/accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const res = await proxyFetch(`/agent/debug/test-s3/${account.id}`);
      const d = await res.json() as { ok: boolean; bucket?: string; error?: string };
      setTestResult({ ok: d.ok, message: d.ok ? `Connected to bucket: ${d.bucket}` : (d.error ?? "Connection failed") });
    } catch {
      setTestResult({ ok: false, message: "Network error" });
    }
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await proxyFetch(`/agent/inbox/accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sesFromAddresses: form.sesFromAddresses.filter((a) => a.trim()) }),
      });
      if (res.ok) {
        onSaved({ ...account, label: form.label, s3Bucket: form.s3Bucket, sesFromEmail: form.sesFromEmail, sesFromAddresses: form.sesFromAddresses.filter((a) => a.trim()), hasCredentials: !!(form.accessKeyId || account.hasCredentials) });
        setDialogOpen(false);
      } else {
        setError("Save failed.");
      }
    } catch {
      setError("Network error.");
    }
    setSaving(false);
  };

  const handleDisconnect = async () => {
    await proxyFetch(`/agent/inbox/accounts/${account.id}`, { method: "DELETE" });
    onRemoved(account.id);
  };

  return (
    <>
      <ConnectorCard
        name={account.label}
        description={account.hasCredentials
          ? `Receiving email to ${account.s3Bucket || "S3 bucket"}.`
          : "Connect AWS to send email via SES and receive email from S3."}
        icon={
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FF9900", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Mail style={{ width: 24, height: 24, color: "#fff" }} />
          </div>
        }
        status={account.hasCredentials ? "connected" : "disconnected"}
        workspaceName={account.s3Bucket || undefined}
        onConnect={() => openDialog()}
        onDisconnect={handleDisconnect}
        onManage={() => openDialog()}
        manageLabel="Configure"
        onDelete={!account.hasCredentials ? handleDisconnect : undefined}
      />

      {dialogOpen && (
        <>
          <div className={dialogStyles.overlay} onClick={() => setDialogOpen(false)} />
          <div className={dialogStyles.content}>
            <div className={dialogStyles.header}>
              <h2 className={dialogStyles.title}>AWS SES / S3</h2>
              <p className={dialogStyles.description}>Connect your AWS account to send email via SES and receive email from S3.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className={inputStyles.input} type="text" placeholder="Account label (e.g. Work, Personal)" value={form.label} onChange={(e) => set("label", e.target.value)} />
              <input className={inputStyles.input} type="password" placeholder="AWS Access Key ID" value={form.accessKeyId} onChange={(e) => set("accessKeyId", e.target.value)} />
              <input className={inputStyles.input} type="password" placeholder="AWS Secret Access Key" value={form.secretAccessKey} onChange={(e) => set("secretAccessKey", e.target.value)} />
              <input className={inputStyles.input} type="text" placeholder="S3 Bucket Name" value={form.s3Bucket} onChange={(e) => set("s3Bucket", e.target.value)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input className={inputStyles.input} type="text" placeholder="AWS Region (us-east-1)" value={form.region} onChange={(e) => set("region", e.target.value)} />
                <input className={inputStyles.input} type="text" placeholder="SES Region (us-east-1)" value={form.sesRegion} onChange={(e) => set("sesRegion", e.target.value)} />
              </div>
              <input className={inputStyles.input} type="email" placeholder="Primary From Email" value={form.sesFromEmail} onChange={(e) => set("sesFromEmail", e.target.value)} />

              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", margin: 0 }}>
                  Send-from Addresses
                </p>
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                  Add all verified SES email addresses you want to send from.
                </p>
                {form.sesFromAddresses.map((addr, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      className={inputStyles.input}
                      type="email"
                      placeholder="email@example.com"
                      value={addr}
                      onChange={(e) => {
                        const updated = [...form.sesFromAddresses];
                        updated[i] = e.target.value;
                        setForm((f) => ({ ...f, sesFromAddresses: updated, sesFromEmail: updated[0] ?? f.sesFromEmail }));
                      }}
                      style={{ flex: 1 }}
                    />
                    {form.sesFromAddresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = form.sesFromAddresses.filter((_, idx) => idx !== i);
                          setForm((f) => ({ ...f, sesFromAddresses: updated, sesFromEmail: updated[0] ?? "" }));
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: 14, padding: 4 }}
                      >✕</button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, sesFromAddresses: [...f.sesFromAddresses, ""] }))}
                  style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--color-accent)", fontSize: "var(--font-size-xs)", fontWeight: 600, cursor: "pointer", padding: 0 }}
                >
                  + Add address
                </button>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", margin: 0 }}>
                  Local Email Storage
                </p>
                <input
                  className={inputStyles.input}
                  style={{ fontFamily: "monospace", fontSize: 13 }}
                  type="text"
                  placeholder="data/emails"
                  value={form.localEmailsPath}
                  onChange={(e) => set("localEmailsPath", e.target.value)}
                />
              </div>

              {testResult && (
                <p style={{ fontSize: "var(--font-size-xs)", color: testResult.ok ? "#45dfa4" : "#e5383b", margin: 0 }}>
                  {testResult.ok ? "✓" : "✗"} {testResult.message}
                </p>
              )}
              {error && <p style={{ fontSize: "var(--font-size-xs)", color: "#e5383b", margin: 0 }}>{error}</p>}
            </div>

            <div className={dialogStyles.footer}>
              <button className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`} onClick={handleTest} disabled={testing || saving}>
                {testing ? "Testing..." : "Test Connection"}
              </button>
              <button className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.md}`} onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</button>
              <button className={`${btnStyles.btn} ${btnStyles.primary} ${btnStyles.md}`} onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
