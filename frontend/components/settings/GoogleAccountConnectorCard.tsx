"use client";
import { proxyFetch } from "@/lib/proxy";
import cardStyles from "@/components/ui/Card.module.css";
import btnStyles from "@/components/ui/Button.module.css";

const PROXY_URL = "";

export type GoogleSubAccount = {
  email: string;
  name: string;
  picture: string;
};

type Props = {
  account: GoogleSubAccount;
  onRemoved: (email: string) => void;
};

export function GoogleAccountConnectorCard({ account, onRemoved }: Props) {
  const handleDisconnect = async () => {
    await proxyFetch(`/auth/connected-accounts/${encodeURIComponent(account.email)}`, { method: "DELETE" });
    onRemoved(account.email);
  };

  return (
    <div className={cardStyles.card} style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 12, right: 12 }}>
        <span style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
      </div>
      <div className={cardStyles.cardContent} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
            {account.picture
              ? <img src={account.picture} alt={account.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "#4285F4", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>
                  {account.name[0]?.toUpperCase()}
                </div>
              )
            }
          </div>
          <div>
            <h3 className={cardStyles.cardTitle}>{account.name}</h3>
            <p className={cardStyles.cardDescription} style={{ marginTop: 2, fontSize: "var(--font-size-xs)" }}>{account.email}</p>
          </div>
        </div>
        <div style={{ marginTop: "auto", paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", letterSpacing: "0.1em", textTransform: "uppercase" }}>Connected</span>
          <button
            className={`${btnStyles.btn} ${btnStyles.danger} ${btnStyles.sm}`}
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

export function AddGoogleAccountButton({ disabled }: { disabled?: boolean }) {
  return (
    <a
      href={disabled ? undefined : `${PROXY_URL}/auth/connect-account`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 140,
        background: "none",
        border: "2px dashed color-mix(in srgb, #4285F4 30%, transparent)",
        borderRadius: "var(--radius-6)",
        cursor: disabled ? "default" : "pointer",
        color: "#4285F4",
        opacity: disabled ? 0.6 : 1,
        textDecoration: "none",
        fontFamily: "var(--font-sans)",
        transition: "background 150ms ease, border-color 150ms ease",
      }}
      onMouseEnter={(e) => { if (!disabled) { (e.currentTarget as HTMLAnchorElement).style.background = "color-mix(in srgb, #4285F4 8%, transparent)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "color-mix(in srgb, #4285F4 60%, transparent)"; } }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "none"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "color-mix(in srgb, #4285F4 30%, transparent)"; }}
    >
      <GoogleGIcon />
      <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 700 }}>Connect Google Workspace</span>
    </a>
  );
}

function GoogleGIcon() {
  return (
    <svg viewBox="0 0 48 48" style={{ width: 24, height: 24 }} xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
