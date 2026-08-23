import {
  Dialog_default
} from "./chunk-VGRKXESR.js";
import {
  PageShell
} from "./chunk-XYH2BRMG.js";
import {
  AppHeader,
  FloatingAssistant,
  clearAgentIcon,
  idbAddAddress,
  idbDeleteAddress,
  idbGetUserPrefs,
  idbListAddresses,
  idbSetUserPrefs,
  idbUpdateAddress,
  notifyAgentIdentityChanged,
  pushPlanningChatSessions,
  pushTasksBackup,
  pushUserData,
  pushUserDataOrThrow,
  saveAgentIcon,
  setAgentIcon
} from "./chunk-ECSCCBAX.js";
import {
  Button_default
} from "./chunk-QLVTPJOM.js";
import {
  Bot,
  Building2,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  HardDriveDownload,
  House,
  LoaderCircle,
  MapPin,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  User,
  __toESM,
  clearSession,
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react
} from "./chunk-7EDR7T7A.js";

// react-entries/settings.tsx
var import_client = __toESM(require_client());

// components/settings/AppearanceSection.tsx
var import_react = __toESM(require_react());

// lib/theme.ts
var systemMediaQuery = null;
var systemMediaHandler = null;
function applyTheme(mode, accent) {
  const root = document.documentElement;
  const isDark = mode === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches : mode === "dark";
  root.setAttribute("data-theme", isDark ? "dark" : "light");
  root.setAttribute("data-accent", accent);
  root.style.colorScheme = isDark ? "dark" : "light";
  if (systemMediaQuery && systemMediaHandler) {
    systemMediaQuery.removeEventListener("change", systemMediaHandler);
    systemMediaQuery = null;
    systemMediaHandler = null;
  }
  if (mode === "system") {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const nextIsDark = media.matches;
      root.setAttribute("data-theme", nextIsDark ? "dark" : "light");
      root.style.colorScheme = nextIsDark ? "dark" : "light";
    };
    media.addEventListener("change", handler);
    systemMediaQuery = media;
    systemMediaHandler = handler;
  }
  localStorage.setItem("theme-mode", mode);
  localStorage.setItem("theme-accent", accent);
}
function loadSavedTheme() {
  const mode = localStorage.getItem("theme-mode") ?? "system";
  const accent = localStorage.getItem("theme-accent") ?? "coral";
  applyTheme(mode, accent);
  return { mode, accent };
}

// components/settings/AppearanceSection.module.css
var AppearanceSection_default = {
  section: "AppearanceSection_section",
  heading: "AppearanceSection_heading",
  field: "AppearanceSection_field",
  label: "AppearanceSection_label",
  segmented: "AppearanceSection_segmented",
  seg: "AppearanceSection_seg",
  segActive: "AppearanceSection_segActive",
  swatches: "AppearanceSection_swatches",
  swatch: "AppearanceSection_swatch",
  swatchActive: "AppearanceSection_swatchActive",
  check: "AppearanceSection_check"
};

// components/settings/AppearanceSection.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
var ACCENTS = [
  { key: "red", color: "#e5383b", label: "Openclaw Red" },
  { key: "coral", color: "#f47560", label: "Coral" },
  { key: "green", color: "#6b9e6b", label: "Matcha" },
  { key: "blue", color: "#1877f2", label: "Blue" },
  { key: "lilac", color: "#9b72cf", label: "Lilac" }
];
function AppearanceSection() {
  const [mode, setMode] = (0, import_react.useState)("system");
  const [accent, setAccent] = (0, import_react.useState)("coral");
  (0, import_react.useEffect)(() => {
    const saved = loadSavedTheme();
    setMode(saved.mode);
    setAccent(saved.accent);
  }, []);
  function handleMode(m) {
    setMode(m);
    applyTheme(m, accent);
    void pushUserData();
  }
  function handleAccent(a) {
    setAccent(a);
    applyTheme(mode, a);
    void pushUserData();
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: AppearanceSection_default.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: AppearanceSection_default.heading, children: "Appearance" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: AppearanceSection_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: AppearanceSection_default.label, children: "Theme" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: AppearanceSection_default.segmented, children: ["light", "dark", "system"].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: `${AppearanceSection_default.seg} ${mode === m ? AppearanceSection_default.segActive : ""}`, onClick: () => handleMode(m), children: m[0].toUpperCase() + m.slice(1) }, m)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: AppearanceSection_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: AppearanceSection_default.label, children: "Accent Color" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: AppearanceSection_default.swatches, children: ACCENTS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          className: `${AppearanceSection_default.swatch} ${accent === a.key ? AppearanceSection_default.swatchActive : ""}`,
          style: { "--swatch-color": a.color },
          onClick: () => handleAccent(a.key),
          "aria-label": a.label,
          title: a.label,
          children: accent === a.key && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: AppearanceSection_default.check, children: "\u2713" })
        },
        a.key
      )) })
    ] })
  ] });
}

// components/settings/AgentSection.tsx
var import_react2 = __toESM(require_react());

// components/settings/AgentSection.module.css
var AgentSection_default = {
  section: "AgentSection_section",
  heading: "AgentSection_heading",
  sub: "AgentSection_sub",
  iconRow: "AgentSection_iconRow",
  iconPreview: "AgentSection_iconPreview",
  iconImg: "AgentSection_iconImg",
  iconPlaceholder: "AgentSection_iconPlaceholder",
  iconOverlay: "AgentSection_iconOverlay",
  iconActions: "AgentSection_iconActions",
  uploadBtn: "AgentSection_uploadBtn",
  clearBtn: "AgentSection_clearBtn",
  hint: "AgentSection_hint",
  hiddenInput: "AgentSection_hiddenInput",
  nameField: "AgentSection_nameField",
  nameLabel: "AgentSection_nameLabel",
  nameRow: "AgentSection_nameRow",
  nameInput: "AgentSection_nameInput",
  saveBtn: "AgentSection_saveBtn",
  nameHint: "AgentSection_nameHint"
};

// components/settings/AgentSection.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
var DEFAULT_AGENT_NAME = "OpenPip";
function AgentSection() {
  const [icon, setIcon] = (0, import_react2.useState)(null);
  const [agentName, setAgentName] = (0, import_react2.useState)(DEFAULT_AGENT_NAME);
  const [savedName, setSavedName] = (0, import_react2.useState)(DEFAULT_AGENT_NAME);
  const [nameSaving, setNameSaving] = (0, import_react2.useState)(false);
  const [iconSaving, setIconSaving] = (0, import_react2.useState)(false);
  const inputRef = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    proxyFetch("/agent/user/data").then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.agentName === "string" && data.agentName.trim()) {
        setAgentName(data.agentName.trim());
        setSavedName(data.agentName.trim());
      }
      if (typeof data.agentIcon === "string" && data.agentIcon) {
        setIcon(data.agentIcon);
      }
    }).catch(() => {
    });
  }, []);
  async function patchUserData(patch) {
    const res = await proxyFetch("/agent/user/data");
    const current = res.ok ? await res.json() : {};
    const body = { ...current, ...patch };
    const putRes = await proxyFetch("/agent/user/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!putRes.ok) throw new Error(`Save failed: ${putRes.status}`);
  }
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await saveAgentIcon(file);
    setIconSaving(true);
    try {
      await patchUserData({ agentIcon: dataUrl });
      setAgentIcon(dataUrl);
      setIcon(dataUrl);
      notifyAgentIdentityChanged(void 0, dataUrl);
    } catch (err) {
      console.error("[AgentSection] icon save failed:", err);
    } finally {
      setIconSaving(false);
    }
  }
  async function handleClear() {
    setIconSaving(true);
    try {
      const res = await proxyFetch("/agent/user/data");
      const current = res.ok ? await res.json() : {};
      delete current.agentIcon;
      const putRes = await proxyFetch("/agent/user/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current)
      });
      if (!putRes.ok) throw new Error("Clear failed");
      clearAgentIcon();
      setIcon(null);
      if (inputRef.current) inputRef.current.value = "";
      notifyAgentIdentityChanged(void 0, null);
    } catch {
    } finally {
      setIconSaving(false);
    }
  }
  async function handleSaveName() {
    const name = agentName.trim() || DEFAULT_AGENT_NAME;
    if (name !== agentName) setAgentName(name);
    setNameSaving(true);
    try {
      await patchUserData({ agentName: name });
      setSavedName(name);
      notifyAgentIdentityChanged(name);
    } catch {
    } finally {
      setNameSaving(false);
    }
  }
  const nameChanged = agentName.trim() !== savedName;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: AgentSection_default.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: AgentSection_default.heading, children: "Your Assistant" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: AgentSection_default.nameField, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: AgentSection_default.nameLabel, children: "Name" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: AgentSection_default.nameRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "input",
          {
            className: AgentSection_default.nameInput,
            value: agentName,
            onChange: (e) => setAgentName(e.target.value),
            placeholder: DEFAULT_AGENT_NAME,
            maxLength: 40,
            spellCheck: false
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            className: AgentSection_default.saveBtn,
            onClick: handleSaveName,
            disabled: nameSaving || !nameChanged,
            children: nameSaving ? "Saving\u2026" : "Save"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: AgentSection_default.nameHint, children: "The name your assistant uses when referring to itself." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: AgentSection_default.iconRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: AgentSection_default.iconPreview, onClick: () => !iconSaving && inputRef.current?.click(), children: [
        icon ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("img", { src: icon, alt: "Agent icon", className: AgentSection_default.iconImg }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("img", { src: "/trippy-transparent.png", alt: "Assistant", className: AgentSection_default.iconImg }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: AgentSection_default.iconOverlay, children: iconSaving ? "Saving\u2026" : "Upload" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: AgentSection_default.iconActions, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: AgentSection_default.uploadBtn, onClick: () => inputRef.current?.click(), disabled: iconSaving, children: icon ? "Change icon" : "Upload icon" }),
        icon && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: AgentSection_default.clearBtn, onClick: handleClear, disabled: iconSaving, children: "Remove" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: AgentSection_default.hint, children: "Square image recommended. JPG, PNG, GIF, WebP." })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { ref: inputRef, type: "file", accept: "image/*", className: AgentSection_default.hiddenInput, onChange: handleFile })
  ] });
}

// components/settings/AddressSection.tsx
var import_react3 = __toESM(require_react());

// components/ui/Card.module.css
var Card_default = {
  card: "Card_card",
  fadeSlideUp: "Card_fadeSlideUp",
  accent: "Card_accent",
  cardHeader: "Card_cardHeader",
  cardTitle: "Card_cardTitle",
  cardDescription: "Card_cardDescription",
  cardAction: "Card_cardAction",
  cardContent: "Card_cardContent",
  cardFooter: "Card_cardFooter"
};

// components/ui/Input.module.css
var Input_default = {
  input: "Input_input"
};

// components/settings/AddressSection.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
function iconForLabel(label) {
  const lower = label.toLowerCase();
  if (lower.includes("home") || lower.includes("house")) return House;
  if (lower.includes("office") || lower.includes("work") || lower.includes("hq")) return Building2;
  if (lower.includes("'s") || lower.includes("place") || lower.includes("mom") || lower.includes("dad")) return User;
  return MapPin;
}
function useAddressAutocomplete() {
  const [query, setQuery] = (0, import_react3.useState)("");
  const [predictions, setPredictions] = (0, import_react3.useState)([]);
  const [loading, setLoading] = (0, import_react3.useState)(false);
  const debounceRef = (0, import_react3.useRef)(void 0);
  (0, import_react3.useEffect)(() => {
    if (query.length < 2) {
      setPredictions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      console.log("[places] Fetching autocomplete for:", query);
      try {
        const res = await proxyFetch(`/agent/places/autocomplete?input=${encodeURIComponent(query)}`);
        const data = await res.json();
        console.log("[places] Got predictions:", data.predictions.length, data.predictions);
        setPredictions(data.predictions ?? []);
      } catch (err) {
        console.error("[places] Autocomplete fetch failed:", err);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);
  return { query, setQuery, predictions, setPredictions, loading };
}
function AddressForm({ initial, onSave, onCancel, saving }) {
  const [label, setLabel] = (0, import_react3.useState)(initial?.label ?? "");
  const [address, setAddress] = (0, import_react3.useState)(initial?.address ?? "");
  const { query, setQuery, predictions, setPredictions, loading: autocompleteLoading } = useAddressAutocomplete();
  const [showSuggestions, setShowSuggestions] = (0, import_react3.useState)(false);
  const handleAddressChange = (value) => {
    setAddress(value);
    setQuery(value);
    setShowSuggestions(true);
  };
  const handleSelectPrediction = (prediction) => {
    console.log("[places] Selected:", prediction.description);
    setAddress(prediction.description);
    setShowSuggestions(false);
    setPredictions([]);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: Card_default.card, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: Card_default.cardContent, style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { style: { fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }, children: "Label" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          className: Input_default.input,
          value: label,
          onChange: (e) => setLabel(e.target.value),
          placeholder: "e.g. Home, Office",
          autoFocus: true
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { style: { fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }, children: "Address" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { position: "relative" }, children: [
        autocompleteLoading ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(LoaderCircle, { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-muted)", animation: "spin 0.6s linear infinite" } }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Search, { style: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-muted)" } }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            className: Input_default.input,
            value: address,
            onChange: (e) => handleAddressChange(e.target.value),
            onFocus: () => predictions.length > 0 && setShowSuggestions(true),
            onBlur: () => setTimeout(() => setShowSuggestions(false), 200),
            placeholder: "Search for an address...",
            style: { paddingLeft: 40 }
          }
        ),
        showSuggestions && predictions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 4, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", overflow: "hidden" }, children: predictions.map((p) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            type: "button",
            style: { width: "100%", textAlign: "left", padding: "12px 16px", fontSize: "var(--font-size-sm)", background: "transparent", border: "none", borderBottom: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text)", transition: "background 150ms ease" },
            onMouseDown: (e) => e.preventDefault(),
            onClick: () => handleSelectPrediction(p),
            children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MapPin, { style: { width: 14, height: 14, color: "var(--color-text-muted)", flexShrink: 0 } }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: p.description })
            ] })
          },
          p.placeId
        )) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, paddingTop: 8 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.md}`, onClick: onCancel, disabled: saving, children: "Cancel" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          className: `${Button_default.btn} ${Button_default.primary} ${Button_default.md}`,
          onClick: () => onSave(label.trim(), address.trim()),
          disabled: !label.trim() || !address.trim() || saving,
          children: saving ? "Saving..." : "Save"
        }
      )
    ] })
  ] }) });
}
function AddressSection() {
  const [addresses, setAddresses] = (0, import_react3.useState)([]);
  const [loading, setLoading] = (0, import_react3.useState)(true);
  const [showForm, setShowForm] = (0, import_react3.useState)(false);
  const [editingId, setEditingId] = (0, import_react3.useState)(null);
  const [deleteTarget, setDeleteTarget] = (0, import_react3.useState)(null);
  const [saving, setSaving] = (0, import_react3.useState)(false);
  const refresh = (0, import_react3.useCallback)(async () => {
    const list = await idbListAddresses();
    setAddresses(list);
  }, []);
  (0, import_react3.useEffect)(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);
  const handleAdd = async (label, address) => {
    setSaving(true);
    await idbAddAddress({ label, address });
    await refresh();
    setShowForm(false);
    setSaving(false);
  };
  const handleEdit = async (label, address) => {
    if (!editingId) return;
    setSaving(true);
    await idbUpdateAddress(editingId, { label, address });
    await refresh();
    setEditingId(null);
    setSaving(false);
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    await idbDeleteAddress(deleteTarget.id);
    await refresh();
    setDeleteTarget(null);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { style: { position: "relative", zIndex: 1 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MapPin, { style: { width: 20, height: 20, color: "var(--color-accent)" } }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { style: { fontSize: "var(--font-size-lg)", fontWeight: 600, letterSpacing: "-0.02em", margin: 0, color: "var(--color-text)" }, children: "Saved Addresses" })
    ] }),
    loading ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: Card_default.card, style: { padding: 0 }, children: [1, 2, 3].map((i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { padding: 20, display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid var(--color-border)" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { width: 40, height: 40, borderRadius: 8, background: "var(--color-bg)", flexShrink: 0 } }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { height: 16, width: 96, borderRadius: 4, background: "var(--color-bg)" } }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { height: 12, width: 192, borderRadius: 4, background: "var(--color-bg)" } })
      ] })
    ] }, i)) }) : addresses.length === 0 && !showForm ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: Card_default.card, style: { border: "1px dashed var(--color-border)" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { width: 80, height: 80, background: "var(--color-bg)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(MapPin, { style: { width: 40, height: 40, color: "var(--color-text-muted)", opacity: 0.4 } }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { style: { fontWeight: 700, fontSize: "var(--font-size-lg)", margin: 0 }, children: "No saved addresses yet" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", marginTop: 8, maxWidth: 240, lineHeight: 1.6 }, children: "Add your frequent locations for faster trip planning." })
    ] }) }) : addresses.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: Card_default.card, style: { padding: 0 }, children: addresses.map((addr, idx) => {
      if (editingId === addr.id) {
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { padding: 16, borderBottom: idx < addresses.length - 1 ? "1px solid var(--color-border)" : void 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          AddressForm,
          {
            initial: { label: addr.label, address: addr.address },
            onSave: handleEdit,
            onCancel: () => setEditingId(null),
            saving
          }
        ) }, addr.id);
      }
      const Icon = iconForLabel(addr.label);
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "div",
        {
          style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottom: idx < addresses.length - 1 ? "1px solid var(--color-border)" : void 0, transition: "background 150ms ease" },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", gap: 16, alignItems: "center", minWidth: 0 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { width: 40, height: 40, borderRadius: 8, background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { style: { width: 20, height: 20, color: "var(--color-accent)" } }) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { minWidth: 0 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { fontWeight: 600, color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: addr.label }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: addr.address })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "button",
                {
                  className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`,
                  style: { width: 32, height: 32, padding: 0 },
                  onClick: () => setEditingId(addr.id),
                  children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Pencil, { style: { width: 16, height: 16 } })
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "button",
                {
                  className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.sm}`,
                  style: { width: 32, height: 32, padding: 0, color: "#e5383b" },
                  onClick: () => setDeleteTarget(addr),
                  children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Trash2, { style: { width: 16, height: 16 } })
                }
              )
            ] })
          ]
        },
        addr.id
      );
    }) }) : null,
    showForm ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { marginTop: 24 }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(AddressForm, { onSave: handleAdd, onCancel: () => setShowForm(false), saving }) }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
      "button",
      {
        className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.md}`,
        style: { marginTop: 24, width: "100%", borderRadius: "var(--radius-lg)" },
        onClick: () => setShowForm(true),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Plus, { style: { width: 16, height: 16, marginRight: 8 } }),
          "Add Address"
        ]
      }
    ),
    !!deleteTarget && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: Dialog_default.overlay, onClick: () => setDeleteTarget(null) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: Dialog_default.content, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: Dialog_default.header, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("h2", { className: Dialog_default.title, children: [
            "Delete ",
            deleteTarget?.label,
            "?"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: Dialog_default.description, children: "This can't be undone. The address will be removed from your saved locations." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: Dialog_default.footer, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: `${Button_default.btn} ${Button_default.ghost} ${Button_default.md}`, onClick: () => setDeleteTarget(null), children: "Cancel" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: `${Button_default.btn} ${Button_default.danger} ${Button_default.md}`, onClick: handleDelete, children: "Delete" })
        ] })
      ] })
    ] })
  ] });
}

// components/settings/ConnectorSection.tsx
var import_react4 = __toESM(require_react());

// components/settings/GoogleAccountConnectorCard.tsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime());
var PROXY_URL = "";
function GoogleAccountConnectorCard({ account, onRemoved }) {
  const handleDisconnect = async () => {
    await proxyFetch(`/auth/connected-accounts/${encodeURIComponent(account.email)}`, { method: "DELETE" });
    onRemoved(account.email);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: Card_default.card, style: { position: "relative", overflow: "hidden" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { position: "absolute", top: 12, right: 12 }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { display: "block", width: 8, height: 8, borderRadius: "50%", background: "#10b981" } }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: Card_default.cardContent, style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", alignItems: "flex-start", gap: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { width: 48, height: 48, borderRadius: 12, overflow: "hidden", flexShrink: 0 }, children: account.picture ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("img", { src: account.picture, alt: account.name, style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { width: 48, height: 48, borderRadius: 12, background: "#4285F4", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }, children: account.name[0]?.toUpperCase() }) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { className: Card_default.cardTitle, children: account.name }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: Card_default.cardDescription, style: { marginTop: 2, fontSize: "var(--font-size-xs)" }, children: account.email })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { marginTop: "auto", paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: 10, fontWeight: 700, color: "#059669", letterSpacing: "0.1em", textTransform: "uppercase" }, children: "Connected" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            className: `${Button_default.btn} ${Button_default.danger} ${Button_default.sm}`,
            onClick: handleDisconnect,
            children: "Disconnect"
          }
        )
      ] })
    ] })
  ] });
}
function AddGoogleAccountButton({ disabled }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "a",
    {
      href: disabled ? void 0 : `${PROXY_URL}/auth/connect-account`,
      style: {
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
        transition: "background 150ms ease, border-color 150ms ease"
      },
      onMouseEnter: (e) => {
        if (!disabled) {
          e.currentTarget.style.background = "color-mix(in srgb, #4285F4 8%, transparent)";
          e.currentTarget.style.borderColor = "color-mix(in srgb, #4285F4 60%, transparent)";
        }
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = "none";
        e.currentTarget.style.borderColor = "color-mix(in srgb, #4285F4 30%, transparent)";
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(GoogleGIcon, {}),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: "var(--font-size-sm)", fontWeight: 700 }, children: "Connect Google Workspace" })
      ]
    }
  );
}
function GoogleGIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { viewBox: "0 0 48 48", style: { width: 24, height: 24 }, xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { fill: "#EA4335", d: "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { fill: "#4285F4", d: "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { fill: "#FBBC05", d: "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { fill: "#34A853", d: "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" })
  ] });
}

// components/settings/ConnectorSection.tsx
var import_jsx_runtime5 = __toESM(require_jsx_runtime());
function ConnectorSection() {
  const [account, setAccount] = (0, import_react4.useState)(null);
  const [loading, setLoading] = (0, import_react4.useState)(true);
  (0, import_react4.useEffect)(() => {
    let active = true;
    proxyFetch("/auth/me").then(async (response) => response.ok ? response.json() : null).then((data) => {
      if (!active || !data) return;
      const connected = data.subAccounts?.[0];
      setAccount(connected ?? (data.email ? {
        email: data.email,
        name: data.name ?? data.email,
        picture: data.picture ?? ""
      } : null));
    }).catch(() => {
      if (active) setAccount(null);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(GoogleIcon, {}),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { style: { fontSize: "var(--font-size-lg)", fontWeight: 600, letterSpacing: "-0.02em", margin: 0, color: "var(--color-text)" }, children: "Google Workspace" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { margin: "4px 0 0", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }, children: "One Google account for Gmail, Calendar, Tasks, and Drive." })
      ] })
    ] }),
    loading ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { minHeight: 140, borderRadius: "var(--radius-6)", background: "var(--color-bg-muted)", opacity: 0.65 }, "aria-label": "Loading Google Workspace connection" }) : account ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { maxWidth: 420 }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(GoogleAccountConnectorCard, { account, onRemoved: () => setAccount(null) }) }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { maxWidth: 420 }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(AddGoogleAccountButton, {}) })
  ] });
}
function GoogleIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { viewBox: "0 0 48 48", style: { width: 20, height: 20 }, xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { fill: "#EA4335", d: "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { fill: "#4285F4", d: "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { fill: "#FBBC05", d: "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { fill: "#34A853", d: "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" })
  ] });
}

// components/settings/DataBackupSection.tsx
var import_react5 = __toESM(require_react());
var import_jsx_runtime6 = __toESM(require_jsx_runtime());
function DataBackupSection() {
  const [state, setState] = (0, import_react5.useState)("idle");
  const handleBackup = async () => {
    setState("loading");
    try {
      await Promise.all([pushUserDataOrThrow(), pushTasksBackup(), pushPlanningChatSessions()]);
      setState("success");
      setTimeout(() => setState("idle"), 3e3);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4e3);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(HardDriveDownload, { style: { width: 20, height: 20, color: "var(--color-accent)" } }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { style: { fontSize: "var(--font-size-lg)", fontWeight: 600, letterSpacing: "-0.02em", margin: 0, color: "var(--color-text)" }, children: "Data & Backup" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface)", boxShadow: "var(--shadow-md)", padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { minWidth: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { style: { fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", margin: 0 }, children: "Back up to server" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: 2, marginBottom: 0 }, children: "Saves your addresses and chat history to the agent so they reload on any device." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }, children: [
        state === "success" && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: "var(--font-size-xs)", color: "#059669" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CircleCheck, { style: { width: 16, height: 16 } }),
          "Backed up"
        ] }),
        state === "error" && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: "var(--font-size-xs)", color: "#e5383b" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CircleAlert, { style: { width: 16, height: 16 } }),
          "Failed"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "button",
          {
            className: `${Button_default.btn} ${Button_default.secondary} ${Button_default.sm}`,
            onClick: handleBackup,
            disabled: state === "loading",
            children: state === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(LoaderCircle, { style: { width: 16, height: 16, marginRight: 6, animation: "spin 0.6s linear infinite" } }),
              "Backing up\u2026"
            ] }) : "Back Up Now"
          }
        )
      ] })
    ] })
  ] });
}

// components/settings/NotificationSoundSection.tsx
var import_react6 = __toESM(require_react());

// lib/sounds.ts
var SOUND_NAMES = [
  "chime",
  "ping",
  "ding",
  "bell",
  "doorbell",
  "pop",
  "blip",
  "swoosh",
  "none"
];
var SOUND_LABELS = {
  chime: "Chime",
  ping: "Ping",
  ding: "Ding",
  bell: "Bell",
  doorbell: "Doorbell",
  pop: "Pop",
  blip: "Blip",
  swoosh: "Swoosh",
  none: "None"
};
var SOUND_DESCRIPTIONS = {
  chime: "Three-note ascending",
  ping: "Single clean high tone",
  ding: "Single warm tone, long sustain",
  bell: "Rich bell with harmonics",
  doorbell: "Two-note descending",
  pop: "Soft percussive pop",
  blip: "Short electronic blip",
  swoosh: "Rising frequency sweep",
  none: "Silent"
};
var PITCH_LABELS = {
  "-1": "Low",
  "0": "Normal",
  "1": "High"
};
var SOUND_FNS = {
  chime: (ctx, vol, p) => {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    [[880, 0], [1320, 0.13], [1760, 0.26]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * p;
      osc.connect(gain);
      const start = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.4 * vol, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(1e-4, start + 0.8);
      osc.start(start);
      osc.stop(start + 0.8);
    });
  },
  ping: (ctx, vol, p) => {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 1760 * p;
    osc.connect(gain);
    const start = ctx.currentTime;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.5 * vol, start + 5e-3);
    gain.gain.exponentialRampToValueAtTime(1e-4, start + 0.4);
    osc.start(start);
    osc.stop(start + 0.4);
  },
  ding: (ctx, vol, p) => {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 660 * p;
    osc.connect(gain);
    const start = ctx.currentTime;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.4 * vol, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(1e-4, start + 1.5);
    osc.start(start);
    osc.stop(start + 1.5);
  },
  bell: (ctx, vol, p) => {
    [[440, 0.3], [880, 0.2], [1318, 0.12], [2200, 0.06]].forEach(([freq, amp]) => {
      const g = ctx.createGain();
      g.connect(ctx.destination);
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * p;
      osc.connect(g);
      const start = ctx.currentTime;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(amp * vol, start + 0.01);
      g.gain.exponentialRampToValueAtTime(1e-4, start + 2);
      osc.start(start);
      osc.stop(start + 2);
    });
  },
  doorbell: (ctx, vol, p) => {
    [[587, 0], [494, 0.35]].forEach(([freq, delay]) => {
      const g = ctx.createGain();
      g.connect(ctx.destination);
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * p;
      osc.connect(g);
      const start = ctx.currentTime + delay;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.4 * vol, start + 0.01);
      g.gain.exponentialRampToValueAtTime(1e-4, start + 0.5);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  },
  pop: (ctx, vol, p) => {
    const g = ctx.createGain();
    g.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200 * p, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60 * p, ctx.currentTime + 0.08);
    osc.connect(g);
    g.gain.setValueAtTime(0.5 * vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(1e-4, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  },
  blip: (ctx, vol, p) => {
    const g = ctx.createGain();
    g.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 880 * p;
    osc.connect(g);
    const start = ctx.currentTime;
    g.gain.setValueAtTime(0.2 * vol, start);
    g.gain.exponentialRampToValueAtTime(1e-4, start + 0.08);
    osc.start(start);
    osc.stop(start + 0.08);
  },
  swoosh: (ctx, vol, p) => {
    const g = ctx.createGain();
    g.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300 * p, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400 * p, ctx.currentTime + 0.4);
    osc.connect(g);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.3 * vol, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(1e-4, ctx.currentTime + 0.45);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  }
};
function playSound(name, options) {
  if (name === "none") return;
  try {
    const ctx = new AudioContext();
    const vol = options?.volume ?? 1;
    const pitchMult = options?.pitch === -1 ? 0.5 : options?.pitch === 1 ? 2 : 1;
    SOUND_FNS[name](ctx, vol, pitchMult);
    setTimeout(() => ctx.close(), 3e3);
  } catch {
  }
}
function normalizeSound(val) {
  if (!val || val === "true") return "chime";
  if (val === "false") return "none";
  if (SOUND_NAMES.includes(val)) return val;
  return "chime";
}

// components/settings/NotificationSoundSection.tsx
var import_jsx_runtime7 = __toESM(require_jsx_runtime());
function NotificationSoundSection() {
  const [sound, setSound] = (0, import_react6.useState)("chime");
  const [volume, setVolume] = (0, import_react6.useState)(80);
  const [pitch, setPitch] = (0, import_react6.useState)(0);
  const [loaded, setLoaded] = (0, import_react6.useState)(false);
  (0, import_react6.useEffect)(() => {
    idbGetUserPrefs().then((prefs) => {
      setSound(normalizeSound(prefs.notificationSound ?? null));
      setVolume(prefs.notificationVolume ? parseInt(prefs.notificationVolume, 10) : 80);
      setPitch(prefs.notificationPitch ? parseInt(prefs.notificationPitch, 10) : 0);
    }).catch(() => {
    }).finally(() => setLoaded(true));
  }, []);
  const selectSound = async (name) => {
    setSound(name);
    await idbSetUserPrefs({ notificationSound: name });
    void pushUserData();
  };
  const changeVolume = async (val) => {
    setVolume(val);
    await idbSetUserPrefs({ notificationVolume: String(val) });
    void pushUserData();
  };
  const changePitch = async (val) => {
    setPitch(val);
    await idbSetUserPrefs({ notificationPitch: String(val) });
    void pushUserData();
  };
  const preview = (name) => {
    if (name === "none") return;
    playSound(name, { volume: volume / 100, pitch });
  };
  if (!loaded) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h2", { style: { fontSize: "var(--font-size-xs)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-muted)", marginBottom: 16 }, children: "Notifications" }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", marginBottom: 12 }, children: "Notification sound" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 6 }, children: SOUND_NAMES.map((name) => {
          const selected = sound === name;
          return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
            "div",
            {
              onClick: () => void selectSound(name),
              style: {
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                background: selected ? "var(--color-accent-light)" : "transparent",
                outline: selected ? "1px solid var(--color-accent)" : "none",
                transition: "background 150ms ease"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: {
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: selected ? "2px solid var(--color-accent)" : "2px solid var(--color-text-muted)",
                  background: selected ? "var(--color-accent)" : "transparent",
                  transition: "border-color 150ms ease, background 150ms ease"
                } }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", margin: 0 }, children: SOUND_LABELS[name] }),
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.3, margin: 0 }, children: SOUND_DESCRIPTIONS[name] })
                ] }),
                name !== "none" && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "button",
                  {
                    type: "button",
                    "aria-label": `Preview ${SOUND_LABELS[name]}`,
                    onClick: (e) => {
                      e.stopPropagation();
                      preview(name);
                    },
                    style: {
                      flexShrink: 0,
                      padding: 6,
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "var(--color-text-muted)",
                      transition: "background 150ms ease, color 150ms ease"
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Play, { style: { width: 12, height: 12 } })
                  }
                )
              ]
            },
            name
          );
        }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", margin: 0 }, children: "Volume" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: 2, marginBottom: 0 }, children: [
            volume,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "input",
          {
            type: "range",
            min: 0,
            max: 100,
            value: volume,
            onChange: (e) => void changeVolume(parseInt(e.target.value, 10)),
            style: { width: 144, accentColor: "var(--color-accent)" }
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", margin: 0 }, children: "Pitch" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: 2, marginBottom: 0 }, children: PITCH_LABELS[pitch] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { display: "flex", gap: 4 }, children: [-1, 0, 1].map((p) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "button",
          {
            type: "button",
            onClick: () => void changePitch(p),
            style: {
              padding: "6px 12px",
              fontSize: "var(--font-size-xs)",
              fontWeight: 500,
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
              background: pitch === p ? "var(--color-accent)" : "var(--color-bg)",
              color: pitch === p ? "#fff" : "var(--color-text-muted)",
              transition: "background 150ms ease, color 150ms ease"
            },
            children: PITCH_LABELS[p]
          },
          p
        )) })
      ] })
    ] })
  ] });
}

// components/settings/AgentGuidelinesSection.tsx
var import_react7 = __toESM(require_react());
var import_jsx_runtime8 = __toESM(require_jsx_runtime());
async function fetchDriveUrl(path) {
  const res = await proxyFetch(path);
  if (!res.ok) return null;
  const data = await res.json();
  return data.driveUrl ?? null;
}
function AgentGuidelinesSection() {
  const [links, setLinks] = (0, import_react7.useState)([
    { label: "Assistant Identity", description: "Customize your assistant's personality, tone, and behaviors \u2014 shared across all agents.", url: null, state: "loading" },
    { label: "Travel Agent", description: "Your travel preferences, accommodation rules, and transport assumptions.", url: null, state: "loading" },
    { label: "Executive Assistant", description: "Your priorities, working style, and standing rules for your chief of staff.", url: null, state: "loading" },
    { label: "Proactive Proposals", description: "How the background scan proposes work \u2014 which system owns what, which email confirmations matter, and how eager to be.", url: null, state: "loading" }
  ]);
  (0, import_react7.useEffect)(() => {
    const fetches = [
      { index: 0, path: "/agent/agent-file" },
      { index: 1, path: "/agent/goals-n-guidelines/travel-planner" },
      { index: 2, path: "/agent/goals-n-guidelines/executive-assistant" },
      { index: 3, path: "/agent/goals-n-guidelines/proactive-review" }
    ];
    fetches.forEach(({ index, path }) => {
      fetchDriveUrl(path).then((url) => {
        setLinks((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], url, state: url ? "ready" : "unavailable" };
          return next;
        });
      }).catch(() => {
        setLinks((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], state: "unavailable" };
          return next;
        });
      });
    });
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Bot, { style: { width: 20, height: 20, color: "var(--color-accent)" } }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h2", { style: { fontSize: "var(--font-size-lg)", fontWeight: 600, letterSpacing: "-0.02em", margin: 0, color: "var(--color-text)" }, children: "Agent & Guidelines" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: links.map((link) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
      "div",
      {
        style: {
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          boxShadow: "var(--shadow-md)",
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: { fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", margin: 0 }, children: link.label }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: 2, marginBottom: 0 }, children: link.description })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { flexShrink: 0 }, children: [
            link.state === "loading" && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(LoaderCircle, { style: { width: 16, height: 16, color: "var(--color-text-muted)", animation: "spin 0.6s linear infinite" } }),
            link.state === "ready" && link.url && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
              "a",
              {
                href: link.url,
                target: "_blank",
                rel: "noopener noreferrer",
                style: {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "var(--font-size-xs)",
                  fontWeight: 500,
                  color: "var(--color-accent)",
                  textDecoration: "none"
                },
                children: [
                  "Edit in Drive",
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ExternalLink, { style: { width: 12, height: 12 } })
                ]
              }
            ),
            link.state === "unavailable" && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }, children: "Sign in to Google to edit" })
          ] })
        ]
      },
      link.label
    )) })
  ] });
}

// components/settings/SettingsPage.module.css
var SettingsPage_default = {
  heroCard: "SettingsPage_heroCard",
  heroTop: "SettingsPage_heroTop",
  titleBlock: "SettingsPage_titleBlock",
  title: "SettingsPage_title",
  subtitle: "SettingsPage_subtitle",
  heroDivider: "SettingsPage_heroDivider",
  heroBottom: "SettingsPage_heroBottom",
  sections: "SettingsPage_sections"
};

// components/settings/SettingsPage.tsx
var import_jsx_runtime9 = __toESM(require_jsx_runtime());
function SettingsPage({ userEmail, userName, userImage }) {
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(AppHeader, { userImage, userName, initials, pageTitle: "Settings" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(PageShell, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: SettingsPage_default.heroCard, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: SettingsPage_default.heroTop, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: SettingsPage_default.titleBlock, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h1", { className: SettingsPage_default.title, children: "Settings" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: SettingsPage_default.subtitle, children: "Manage your preferences and saved locations." })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: SettingsPage_default.heroDivider }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: SettingsPage_default.heroBottom, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(AppearanceSection, {}),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(AgentSection, {})
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: SettingsPage_default.sections, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(AgentGuidelinesSection, {}),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(AddressSection, {}),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ConnectorSection, {}),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(NotificationSoundSection, {}),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(DataBackupSection, {})
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { marginTop: 48, paddingTop: 32, borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-start" }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        "button",
        {
          className: `${Button_default.btn} ${Button_default.danger} ${Button_default.md}`,
          onClick: () => proxyFetch("/auth/logout", { method: "POST" }).finally(() => {
            clearSession();
            window.location.href = "/login";
          }),
          children: "Log out"
        }
      ) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(FloatingAssistant, {})
  ] });
}

// react-entries/settings.tsx
var import_jsx_runtime10 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) {
    redirectToLogin();
    return;
  }
  const u = await r.json();
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime10.jsx)(SettingsPage, { userEmail: u.email ?? "", userName: u.name ?? "", userImage: u.picture ?? "" }));
}
void mount();
