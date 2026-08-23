import {
  FloatingAssistant,
  hasNativeSpeechRecognition,
  prepareOnDeviceTranscription,
  startLocalRecording,
  subscribeOnDeviceTranscription,
  transcribeLocally
} from "./chunk-MBC7QZXQ.js";
import {
  AppHeader,
  Link
} from "./chunk-ZJ44CDQL.js";
import "./chunk-OHWNV7E6.js";
import {
  Mic,
  MicOff,
  X,
  proxyFetch,
  redirectToLogin,
  require_client,
  require_jsx_runtime,
  require_react,
  useParams,
  useRouter
} from "./chunk-YQDVQL7K.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

// react-entries/review-detail.tsx
var import_client = __toESM(require_client());

// components/review/ReviewDetailPage.tsx
var import_react3 = __toESM(require_react());

// components/ui/PromptModal.tsx
var import_react2 = __toESM(require_react());

// hooks/useMicrophone.ts
var import_react = __toESM(require_react());
function useMicrophone(onTranscript) {
  const [listening, setListening] = (0, import_react.useState)(false);
  const [transcribing, setTranscribing] = (0, import_react.useState)(false);
  const [micStatus, setMicStatus] = (0, import_react.useState)(null);
  const recognitionRef = (0, import_react.useRef)(null);
  const localRecordingRef = (0, import_react.useRef)(null);
  const transcriptRef = (0, import_react.useRef)("");
  (0, import_react.useEffect)(() => {
    return subscribeOnDeviceTranscription((status, progress) => {
      if (status === "downloading") setMicStatus(`Downloading local dictation model\u2026 ${progress ?? 0}%`);
      if (status === "ready") setMicStatus("Local dictation is ready");
      if (status === "failed") setMicStatus("Local dictation could not start. Please type instead.");
    });
  }, []);
  (0, import_react.useEffect)(() => {
    return () => {
      recognitionRef.current?.stop();
      localRecordingRef.current?.cancel();
    };
  }, []);
  const stopLocalDictation = (0, import_react.useCallback)(async () => {
    const recording = localRecordingRef.current;
    if (!recording) return;
    localRecordingRef.current = null;
    setListening(false);
    setTranscribing(true);
    setMicStatus("Transcribing on this device\u2026");
    try {
      const audio = await recording.stop();
      const text = await transcribeLocally(audio);
      onTranscript(text);
      setMicStatus(null);
    } catch {
      setMicStatus("Local dictation could not finish. Please try again.");
    } finally {
      setTranscribing(false);
    }
  }, [onTranscript]);
  const startLocalDictation = (0, import_react.useCallback)(async () => {
    try {
      const recording = await startLocalRecording();
      localRecordingRef.current = recording;
      setListening(true);
      setMicStatus("Listening on this device\u2026");
    } catch {
      setMicStatus("Microphone access is needed for local dictation.");
    }
  }, []);
  const startNativeDictation = (0, import_react.useCallback)(() => {
    const w = window;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR || !hasNativeSpeechRecognition()) {
      setMicStatus("Browser dictation is not available on this device.");
      return;
    }
    try {
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (e) => {
        const result = e.results[e.results.length - 1];
        if (result) transcriptRef.current = result[0].transcript;
      };
      rec.onend = () => {
        const t = transcriptRef.current.trim();
        if (t) onTranscript(t);
        transcriptRef.current = "";
        setListening(false);
        setMicStatus(null);
      };
      rec.onerror = () => {
        transcriptRef.current = "";
        setListening(false);
        setMicStatus("Voice input could not hear that. Please try again.");
      };
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
      setMicStatus("Listening\u2026");
    } catch {
      recognitionRef.current = null;
      setMicStatus("Browser dictation could not start. Please try again.");
    }
  }, [onTranscript]);
  const handleMic = (0, import_react.useCallback)(() => {
    if (transcribing) return;
    if (localRecordingRef.current) {
      void stopLocalDictation();
      return;
    }
    if (listening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setListening(false);
        setMicStatus(null);
      } catch {
        recognitionRef.current = null;
        setListening(false);
        setMicStatus("Voice input stopped unexpectedly. Please try again.");
      }
      return;
    }
    void (async () => {
      setMicStatus("Preparing browser dictation\u2026");
      const browserModel = await prepareOnDeviceTranscription();
      if (browserModel) {
        await startLocalDictation();
      } else {
        startNativeDictation();
      }
    })();
  }, [listening, startLocalDictation, startNativeDictation, stopLocalDictation, transcribing]);
  return { listening, transcribing, micStatus, handleMic };
}

// components/ui/PromptModal.module.css
var PromptModal_default = {
  overlay: "PromptModal_overlay",
  modal: "PromptModal_modal",
  header: "PromptModal_header",
  title: "PromptModal_title",
  closeBtn: "PromptModal_closeBtn",
  body: "PromptModal_body",
  input: "PromptModal_input",
  inputFooter: "PromptModal_inputFooter",
  micBtn: "PromptModal_micBtn",
  micActive: "PromptModal_micActive",
  micStatus: "PromptModal_micStatus",
  footer: "PromptModal_footer",
  cancelBtn: "PromptModal_cancelBtn",
  submitBtn: "PromptModal_submitBtn"
};

// components/ui/PromptModal.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
function PromptModal({ open, title, placeholder, submitLabel = "Submit", cancelLabel = "Cancel", onSubmit, onCancel }) {
  const [value, setValue] = (0, import_react2.useState)("");
  const inputRef = (0, import_react2.useRef)(null);
  const appendTranscript = (0, import_react2.useCallback)((text) => {
    setValue((prev) => prev ? prev + " " + text : text);
  }, []);
  const { listening, transcribing, micStatus, handleMic } = useMicrophone(appendTranscript);
  (0, import_react2.useEffect)(() => {
    if (open) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);
  (0, import_react2.useEffect)(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);
  if (!open) return null;
  const handleSubmit = () => {
    onSubmit(value.trim());
    setValue("");
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: PromptModal_default.overlay, onClick: onCancel, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PromptModal_default.modal, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PromptModal_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: PromptModal_default.title, children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: PromptModal_default.closeBtn, onClick: onCancel, "aria-label": "Close", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PromptModal_default.body, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "textarea",
        {
          ref: inputRef,
          className: PromptModal_default.input,
          value,
          onChange: (e) => setValue(e.target.value),
          onKeyDown: handleKeyDown,
          placeholder: placeholder ?? "Type or use the mic\u2026",
          rows: 3
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PromptModal_default.inputFooter, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: `${PromptModal_default.micBtn} ${listening || transcribing ? PromptModal_default.micActive : ""}`,
            onClick: handleMic,
            disabled: transcribing,
            "aria-label": transcribing ? "Transcribing" : listening ? "Stop listening" : "Voice input",
            children: transcribing || listening ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MicOff, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { size: 18 })
          }
        ),
        micStatus && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: PromptModal_default.micStatus, children: micStatus })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: PromptModal_default.footer, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: PromptModal_default.cancelBtn, onClick: onCancel, children: cancelLabel }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: PromptModal_default.submitBtn, onClick: handleSubmit, children: submitLabel })
    ] })
  ] }) });
}

// components/review/SavedInsightCard.module.css
var SavedInsightCard_default = {
  card: "SavedInsightCard_card",
  header: "SavedInsightCard_header",
  typeTag: "SavedInsightCard_typeTag",
  looseTag: "SavedInsightCard_looseTag",
  value: "SavedInsightCard_value",
  note: "SavedInsightCard_note",
  fallback: "SavedInsightCard_fallback"
};

// components/review/SavedInsightCard.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
function SavedInsightCard({ detail, label }) {
  let insight = null;
  try {
    const jsonMatch = detail.match(/\{[\s\S]*\}/);
    if (jsonMatch) insight = JSON.parse(jsonMatch[0]);
  } catch {
  }
  if (insight?.type) {
    const typeLabel = insight.type.replace(/_/g, " ");
    const valueText = Array.isArray(insight.value) ? insight.value.join(", ") : typeof insight.value === "string" ? insight.value : JSON.stringify(insight.value);
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: SavedInsightCard_default.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: SavedInsightCard_default.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: SavedInsightCard_default.typeTag, children: typeLabel }),
        insight.loosely_held && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: SavedInsightCard_default.looseTag, children: "loosely held" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: SavedInsightCard_default.value, children: valueText }),
      insight.note && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: SavedInsightCard_default.note, children: insight.note })
    ] });
  }
  const typeFromLabel = label?.replace(/^Saved insight\s*—?\s*/i, "").trim();
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: SavedInsightCard_default.card, children: [
    typeFromLabel && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: SavedInsightCard_default.header, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: SavedInsightCard_default.typeTag, children: typeFromLabel }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: SavedInsightCard_default.value, children: detail })
  ] });
}

// components/review/ReviewDetailPage.module.css
var ReviewDetailPage_default = {
  shell: "ReviewDetailPage_shell",
  page: "ReviewDetailPage_page",
  heading: "ReviewDetailPage_heading",
  eyebrow: "ReviewDetailPage_eyebrow",
  approvalHeading: "ReviewDetailPage_approvalHeading",
  state: "ReviewDetailPage_state",
  externalAction: "ReviewDetailPage_externalAction",
  stack: "ReviewDetailPage_stack",
  applicationGrid: "ReviewDetailPage_applicationGrid",
  contextStack: "ReviewDetailPage_contextStack",
  card: "ReviewDetailPage_card",
  original: "ReviewDetailPage_original",
  sectionNote: "ReviewDetailPage_sectionNote",
  contextText: "ReviewDetailPage_contextText",
  proposalSource: "ReviewDetailPage_proposalSource",
  preparedRows: "ReviewDetailPage_preparedRows",
  preparedRow: "ReviewDetailPage_preparedRow",
  letter: "ReviewDetailPage_letter",
  materialDetails: "ReviewDetailPage_materialDetails",
  material: "ReviewDetailPage_material",
  meta: "ReviewDetailPage_meta",
  facts: "ReviewDetailPage_facts",
  company: "ReviewDetailPage_company",
  jobLink: "ReviewDetailPage_jobLink",
  actionFooter: "ReviewDetailPage_actionFooter",
  actionsNote: "ReviewDetailPage_actionsNote",
  reasonInput: "ReviewDetailPage_reasonInput",
  actions: "ReviewDetailPage_actions",
  primaryAction: "ReviewDetailPage_primaryAction",
  secondaryAction: "ReviewDetailPage_secondaryAction",
  notice: "ReviewDetailPage_notice",
  success: "ReviewDetailPage_success",
  errorMessage: "ReviewDetailPage_errorMessage",
  error: "ReviewDetailPage_error",
  skeleton: "ReviewDetailPage_skeleton",
  shimmer: "ReviewDetailPage_shimmer"
};

// components/review/ReviewDetailPage.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
function getApplication(item) {
  return item.data?.job;
}
function getEmail(item) {
  return item.data?.draft;
}
function getCampaign(item) {
  return item.data?.campaign;
}
function getProposal(item) {
  return item.data?.proposal;
}
function ReviewDetailPage({ userName, userImage }) {
  const initials = userName.split(" ").map((name) => name[0]).join("").toUpperCase().slice(0, 2);
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [item, setItem] = (0, import_react3.useState)(null);
  const [loading, setLoading] = (0, import_react3.useState)(true);
  const [error, setError] = (0, import_react3.useState)("");
  const [working, setWorking] = (0, import_react3.useState)(false);
  const [message, setMessage] = (0, import_react3.useState)("");
  const [promptModal, setPromptModal] = (0, import_react3.useState)({ open: false, decision: "approved" });
  (0, import_react3.useEffect)(() => {
    if (!id) return;
    let active = true;
    proxyFetch(`/agent/review/${encodeURIComponent(id)}`).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "This item is no longer available.");
      return body.item ?? null;
    }).then((next) => {
      if (active) setItem(next);
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : "Unable to load this review item.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);
  const openDecisionPrompt = (decision) => {
    setPromptModal({ open: true, decision });
  };
  const submitDecision = async (reason) => {
    const { decision } = promptModal;
    setPromptModal({ open: false, decision: "approved" });
    setWorking(true);
    setError("");
    try {
      const response = await proxyFetch(`/agent/review/${encodeURIComponent(id)}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, ...reason.trim() ? { reason: reason.trim() } : {} }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to save your decision.");
      if (decision === "approved" && item?.kind === "email") setMessage("Draft approved. Open Inbox whenever you are ready to make the final send.");
      else router.replace("/review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your decision.");
    } finally {
      setWorking(false);
    }
  };
  const sendCampaign = async () => {
    const campaign2 = item && getCampaign(item);
    if (!campaign2) return;
    setWorking(true);
    setError("");
    try {
      const response = await proxyFetch(`/agent/campaigns/${campaign2.id}/send`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to start the campaign.");
      router.replace("/review");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start the campaign.");
    } finally {
      setWorking(false);
    }
  };
  const application = item && getApplication(item);
  const email = item && getEmail(item);
  const campaign = item && getCampaign(item);
  const proposal = item && getProposal(item);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: ReviewDetailPage_default.shell, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(AppHeader, { userImage, userName, initials, backHref: "/review", backLabel: "Review" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("main", { className: ReviewDetailPage_default.page, children: loading ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: ReviewDetailPage_default.skeleton }) : error && !item ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: ReviewDetailPage_default.error, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Link, { href: "/review", children: "Back to review" })
    ] }) : item && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: `${ReviewDetailPage_default.heading} ${item.kind === "application" ? ReviewDetailPage_default.approvalHeading : ""}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: ReviewDetailPage_default.eyebrow, children: proposal ? item.category ?? "Agent proposal" : item.kind === "application" ? "Application draft" : item.kind === "campaign" ? "Campaign approval" : "Reply draft" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h1", { children: item.title }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: item.summary })
        ] }),
        item.kind === "application" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: ReviewDetailPage_default.state, children: "Needs your approval" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: ReviewDetailPage_default.externalAction, "aria-label": "External action status", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: item.externalAction.label }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: item.externalAction.detail })
      ] }),
      application && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ApplicationReview, { application }),
      email && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(EmailReview, { email }),
      campaign && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CampaignReview, { campaign }),
      proposal && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ProposalReview, { proposal }),
      message && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: ReviewDetailPage_default.success, children: [
        message,
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Link, { href: "/inbox", children: "Open Inbox" })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: ReviewDetailPage_default.errorMessage, children: error }),
      !message && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("footer", { className: ReviewDetailPage_default.actionFooter, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: ReviewDetailPage_default.actionsNote, children: proposal ? "Approval adds this bounded work to Scheduled Actions. It does not send, apply, book, or contact anyone." : item.kind === "application" ? "Approval records your decision only. The agent does not submit this application." : item.kind === "campaign" ? "Approval starts the existing send process." : "Approval saves this draft for your final send in Inbox." }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: ReviewDetailPage_default.actions, children: [
          item.kind !== "campaign" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: ReviewDetailPage_default.secondaryAction, disabled: working, onClick: () => openDecisionPrompt("rejected"), children: proposal ? "Decline proposal" : "Reject draft" }),
          item.kind === "application" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: ReviewDetailPage_default.primaryAction, disabled: working, onClick: () => openDecisionPrompt("approved"), children: working ? "Saving\u2026" : "Approve application draft" }),
          item.kind === "email" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: ReviewDetailPage_default.primaryAction, disabled: working, onClick: () => openDecisionPrompt("approved"), children: working ? "Saving\u2026" : "Approve reply draft" }),
          proposal && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: ReviewDetailPage_default.primaryAction, disabled: working, onClick: () => openDecisionPrompt("approved"), children: working ? "Scheduling\u2026" : "Approve & schedule" }),
          item.kind === "campaign" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: ReviewDetailPage_default.primaryAction, disabled: working, onClick: sendCampaign, children: working ? "Starting\u2026" : "Approve & send campaign" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FloatingAssistant, {}),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      PromptModal,
      {
        open: promptModal.open,
        title: promptModal.decision === "rejected" ? "Why are you declining?" : "Additional instructions",
        placeholder: promptModal.decision === "rejected" ? "Tell the agent why, or what to do instead\u2026" : "Any specific instructions for this task\u2026",
        submitLabel: promptModal.decision === "rejected" ? "Decline" : "Approve",
        cancelLabel: "Skip",
        onSubmit: submitDecision,
        onCancel: () => {
          setPromptModal({ open: false, decision: "approved" });
          void submitDecision("");
        }
      }
    )
  ] });
}
function ApplicationReview({ application }) {
  const coverPreview = application.coverLetter?.slice(0, 760);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: ReviewDetailPage_default.applicationGrid, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: ReviewDetailPage_default.stack, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: `${ReviewDetailPage_default.card} ${ReviewDetailPage_default.packet}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: "Your application packet" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: ReviewDetailPage_default.sectionNote, children: "Prepared from the role, your saved materials, and the job analysis. Nothing has been submitted." }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: ReviewDetailPage_default.preparedRows, children: [
          application.refinements?.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PreparedRow, { title: "Tailored r\xE9sum\xE9", detail: `Updated ${application.refinements.length} experience entr${application.refinements.length === 1 ? "y" : "ies"}.` }) : null,
          application.coverLetter ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PreparedRow, { title: "Cover letter", detail: "Drafted for this role from your saved materials." }) : null,
          application.app_questions?.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PreparedRow, { title: "Application answers", detail: `${application.app_questions.length} response${application.app_questions.length === 1 ? "" : "s"} ready for the form.` }) : null
        ] })
      ] }),
      application.coverLetter && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: `${ReviewDetailPage_default.card} ${ReviewDetailPage_default.letter}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: "Cover letter preview" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("pre", { children: [
          coverPreview,
          application.coverLetter.length > 760 ? "\u2026" : ""
        ] }),
        application.coverLetter.length > 760 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("summary", { children: "Show full cover letter" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("pre", { children: application.coverLetter })
        ] })
      ] }),
      application.refinements?.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: ReviewDetailPage_default.materialDetails, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("summary", { children: [
          "Review r\xE9sum\xE9 updates (",
          application.refinements.length,
          ")"
        ] }),
        application.refinements.map((refinement, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: ReviewDetailPage_default.material, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: refinement.entryTitle }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ul", { children: refinement.refinedBullets.map((bullet, bulletIndex) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("li", { children: bullet }, bulletIndex)) })
        ] }, `${refinement.entryTitle}-${index}`))
      ] }) : null,
      application.app_questions?.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: ReviewDetailPage_default.materialDetails, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("summary", { children: [
          "Review application answers (",
          application.app_questions.length,
          ")"
        ] }),
        application.app_questions.map(([question, answer], index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: ReviewDetailPage_default.material, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: question }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: answer })
        ] }, index))
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("aside", { className: ReviewDetailPage_default.contextStack, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: ReviewDetailPage_default.card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: application.role }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: ReviewDetailPage_default.company, children: application.company }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("dl", { className: ReviewDetailPage_default.facts, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "Status" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: "Draft only" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "Prepared" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: application.updatedAt ? new Date(application.updatedAt).toLocaleDateString(void 0, { month: "short", day: "numeric" }) : "Recently" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "Next step" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: "Your review" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: ReviewDetailPage_default.card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: "Why this was prepared" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: ReviewDetailPage_default.contextText, children: application.analysis?.positioning ?? "The role matches your saved background and the materials the agent prepared for it." })
      ] })
    ] })
  ] });
}
function PreparedRow({ title, detail }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: ReviewDetailPage_default.preparedRow, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: detail })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("b", { children: "Ready" })
  ] });
}
function EmailReview({ email }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: ReviewDetailPage_default.applicationGrid, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: ReviewDetailPage_default.stack, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: ReviewDetailPage_default.card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: "Draft reply" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("pre", { children: email.draft })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: ReviewDetailPage_default.original, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("summary", { children: "Show original message" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: email.originalText })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("aside", { className: ReviewDetailPage_default.contextStack, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: ReviewDetailPage_default.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: "Replying to" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: ReviewDetailPage_default.company, children: email.sender }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("dl", { className: ReviewDetailPage_default.facts, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "Email" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: email.senderEmail })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "Subject" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: email.subject || "(no subject)" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "Status" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: "Draft only" })
        ] })
      ] })
    ] }) })
  ] });
}
function CampaignReview({ campaign }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: ReviewDetailPage_default.applicationGrid, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: ReviewDetailPage_default.stack, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: ReviewDetailPage_default.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: "Sending scope" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: ReviewDetailPage_default.contextText, children: "Nothing has been sent. Approving starts the existing send process." })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("aside", { className: ReviewDetailPage_default.contextStack, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: ReviewDetailPage_default.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: "Campaign details" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("dl", { className: ReviewDetailPage_default.facts, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "Recipients" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: campaign.recipientCount })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "Template" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: campaign.templateId ?? "No template attached" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "From" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: campaign.fromAddress ?? "No sender configured" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "Status" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: "Pending approval" })
        ] })
      ] })
    ] }) })
  ] });
}
function SourceDetail({ detail, kind, label }) {
  if (kind === "insight" || kind === "goal") {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SavedInsightCard, { detail, label });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: detail });
}
function ProposalReview({ proposal }) {
  const label = { career_pipeline: "Career research & job search", networking_pipeline: "Networking & career navigation", trip_plan: "Trip planning", campaign_prepare: "Campaign preparation", task_suggestions: "Task suggestions" };
  const scope = proposal.kind === "trip_plan" ? `${proposal.payload.origin ?? ""} \u2192 ${proposal.payload.destination ?? ""}` : proposal.kind === "campaign_prepare" ? String(proposal.payload.domain ?? "") : "";
  const source = proposal.source;
  const sourceLabel = source?.kind === "conversation" ? "Based on previous conversations" : source?.kind === "insight" || source?.kind === "goal" ? "Based on saved context" : "Source";
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: ReviewDetailPage_default.applicationGrid, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: ReviewDetailPage_default.stack, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: ReviewDetailPage_default.card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: label[proposal.kind] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: ReviewDetailPage_default.contextText, children: proposal.evidence }),
        scope && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dl", { className: ReviewDetailPage_default.facts, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "Scope" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: scope })
        ] }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: ReviewDetailPage_default.card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: "After your approval" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: ReviewDetailPage_default.contextText, children: "The existing background worker starts this bounded work only after you approve it. It does not send, apply, book, or contact anyone." })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("aside", { className: ReviewDetailPage_default.contextStack, children: [
      source && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: ReviewDetailPage_default.card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: "Context used" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: ReviewDetailPage_default.proposalSource, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: sourceLabel }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: source.label }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SourceDetail, { detail: source.detail, kind: source.kind, label: source.label })
        ] }),
        source.href && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Link, { href: source.href, target: "_blank", rel: "noreferrer", className: ReviewDetailPage_default.jobLink, children: "Open source \u2192" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: ReviewDetailPage_default.card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: "Proposal type" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("dl", { className: ReviewDetailPage_default.facts, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "Kind" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: label[proposal.kind] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: "Status" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: "Pending your decision" })
          ] })
        ] })
      ] })
    ] })
  ] });
}

// react-entries/review-detail.tsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime());
async function mount() {
  const r = await proxyFetch("/auth/me");
  if (!r.ok) {
    redirectToLogin();
    return;
  }
  const u = await r.json();
  (0, import_client.createRoot)(document.getElementById("react-root")).render(/* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ReviewDetailPage, { userName: u.name ?? "", userImage: u.picture ?? "" }));
}
void mount();
