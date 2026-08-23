import {
  useAgentIdentity
} from "./chunk-ECSCCBAX.js";
import {
  __toESM,
  require_jsx_runtime
} from "./chunk-7EDR7T7A.js";

// components/TrippyIcon.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
var SIZE_MAP = {
  "h-3 w-3": 12,
  "h-3.5 w-3.5": 14,
  "h-4 w-4": 16,
  "h-5 w-5": 20,
  "h-6 w-6": 24,
  "h-8 w-8": 32,
  "h-10 w-10": 40,
  "h-12 w-12": 48
};
function TrippyIcon({ size, sizeClass, className = "" }) {
  const { name, icon } = useAgentIdentity();
  const px = size ?? (sizeClass ? SIZE_MAP[sizeClass] ?? 40 : 40);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "img",
    {
      src: icon ?? "/trippy-transparent.png",
      alt: name,
      style: { width: px, height: px, borderRadius: 4, flexShrink: 0 },
      className
    }
  );
}

export {
  TrippyIcon
};
