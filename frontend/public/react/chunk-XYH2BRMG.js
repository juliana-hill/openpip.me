import {
  __toESM,
  require_jsx_runtime
} from "./chunk-7EDR7T7A.js";

// components/ui/PageShell.module.css
var PageShell_default = {
  shell: "PageShell_shell",
  main: "PageShell_main"
};

// components/ui/PageShell.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
function PageShell({ children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PageShell_default.shell, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", { className: PageShell_default.main, children }) });
}

export {
  PageShell
};
