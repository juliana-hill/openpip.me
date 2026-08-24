import {
  PageShell
} from "./chunk-45GXUIC7.js";
import {
  FloatingAssistant
} from "./chunk-PV4AZV46.js";
import {
  AppHeader
} from "./chunk-GKLEY6TF.js";
import "./chunk-OHWNV7E6.js";
import {
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime
} from "./chunk-DONEC6XU.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

// react-entries/routes.tsx
var import_client = __toESM(require_client());

// components/routes/RoutesPage.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
function RoutesPage({ userName, userImage }) {
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, { userImage, userName, initials, pageTitle: "Routes" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "section",
      {
        "aria-labelledby": "routes-tbd-title",
        style: {
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          background: "var(--color-surface)",
          padding: "clamp(24px, 5vw, 48px)",
          minHeight: 240,
          display: "grid",
          alignContent: "center",
          gap: 12
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--color-text-muted)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }, children: "Travel planning" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { id: "routes-tbd-title", style: { margin: 0, fontSize: "clamp(28px, 4vw, 40px)" }, children: "TBD" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: 0, maxWidth: 620, color: "var(--color-text-muted)", lineHeight: 1.6 }, children: "Route planning is being redesigned for OpenPip. The existing route components are preserved for reuse." })
        ]
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatingAssistant, {})
  ] });
}

// react-entries/routes.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) {
    redirectToLogin();
    return;
  }
  const u = await r.json();
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RoutesPage, { userName: u.name ?? "", userImage: u.picture ?? "" }));
}
void mount();
