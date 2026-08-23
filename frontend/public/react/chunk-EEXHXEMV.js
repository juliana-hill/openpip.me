import {
  require_jsx_runtime
} from "./chunk-YQDVQL7K.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

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
