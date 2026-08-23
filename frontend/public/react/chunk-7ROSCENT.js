import {
  ChevronDown,
  require_jsx_runtime,
  require_react
} from "./chunk-NPORSBBQ.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

// components/career/job-detail/JobDetailPage.module.css
var JobDetailPage_default = {
  page: "JobDetailPage_page",
  stickyTop: "JobDetailPage_stickyTop",
  loading: "JobDetailPage_loading",
  grid: "JobDetailPage_grid",
  left: "JobDetailPage_left",
  right: "JobDetailPage_right",
  dangerZone: "JobDetailPage_dangerZone"
};

// components/career/job-detail/JobHeader.module.css
var JobHeader_default = {
  section: "JobHeader_section",
  breadcrumb: "JobHeader_breadcrumb",
  backLink: "JobHeader_backLink",
  crumbs: "JobHeader_crumbs",
  crumbLink: "JobHeader_crumbLink",
  crumbCurrent: "JobHeader_crumbCurrent",
  titleRow: "JobHeader_titleRow",
  titleLeft: "JobHeader_titleLeft",
  titleEdit: "JobHeader_titleEdit",
  titleInput: "JobHeader_titleInput",
  titleStatic: "JobHeader_titleStatic",
  title: "JobHeader_title",
  editBtn: "JobHeader_editBtn",
  iconBtn: "JobHeader_iconBtn",
  meta: "JobHeader_meta",
  company: "JobHeader_company",
  urlLink: "JobHeader_urlLink",
  badges: "JobHeader_badges",
  statusBadge: "JobHeader_statusBadge",
  urlRow: "JobHeader_urlRow",
  urlText: "JobHeader_urlText",
  urlVerified: "JobHeader_urlVerified",
  urlNone: "JobHeader_urlNone",
  urlInput: "JobHeader_urlInput",
  urlActions: "JobHeader_urlActions",
  pillBtn: "JobHeader_pillBtn"
};

// components/career/job-detail/JobStatusBar.module.css
var JobStatusBar_default = {
  bar: "JobStatusBar_bar",
  chip: "JobStatusBar_chip",
  chipActive: "JobStatusBar_chipActive",
  icon: "JobStatusBar_icon"
};

// components/career/job-detail/panel.module.css
var panel_default = {
  panel: "panel_panel",
  fadeSlideUp: "panel_fadeSlideUp",
  panelHeader: "panel_panelHeader",
  panelTitle: "panel_panelTitle",
  panelIcon: "panel_panelIcon",
  panelHeading: "panel_panelHeading",
  panelBody: "panel_panelBody",
  textarea: "panel_textarea",
  sectionLabel: "panel_sectionLabel",
  emptyText: "panel_emptyText",
  errorText: "panel_errorText",
  statusMsg: "panel_statusMsg",
  skeleton: "panel_skeleton",
  shimmer: "panel_shimmer",
  skeletonList: "panel_skeletonList",
  divider: "panel_divider",
  collapseWrapper: "panel_collapseWrapper",
  collapseWrapperClosed: "panel_collapseWrapperClosed",
  collapseInner: "panel_collapseInner",
  chevronIcon: "panel_chevronIcon",
  chevronCollapsed: "panel_chevronCollapsed",
  tabs: "panel_tabs",
  tab: "panel_tab",
  tabActive: "panel_tabActive"
};

// components/career/job-detail/CollapsiblePanel.tsx
var import_react = __toESM(require_react());
var import_jsx_runtime = __toESM(require_jsx_runtime());
function CollapsiblePanel({
  icon,
  title,
  actions,
  children,
  defaultCollapsed = false,
  subheader
}) {
  const [collapsed, setCollapsed] = (0, import_react.useState)(defaultCollapsed);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: panel_default.panel, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        className: panel_default.panelHeader,
        style: { cursor: "pointer", userSelect: "none" },
        onClick: () => setCollapsed((c) => !c),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: panel_default.panelTitle, children: [
            icon,
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: panel_default.panelHeading, children: title })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: { display: "flex", alignItems: "center", gap: 8 },
              onClick: (e) => e.stopPropagation(),
              children: [
                actions,
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  ChevronDown,
                  {
                    size: 15,
                    color: "var(--color-text-muted)",
                    className: `${panel_default.chevronIcon} ${collapsed ? panel_default.chevronCollapsed : ""}`
                  }
                )
              ]
            }
          )
        ]
      }
    ),
    subheader && !collapsed && subheader,
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `${panel_default.collapseWrapper} ${collapsed ? panel_default.collapseWrapperClosed : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: panel_default.collapseInner, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: panel_default.panelBody, children }) }) })
  ] });
}

export {
  JobHeader_default,
  JobStatusBar_default,
  panel_default,
  CollapsiblePanel,
  JobDetailPage_default
};
