"use client";

import { proxyFetch } from "@/lib/proxy";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Mic, MicOff, X, History, ChevronLeft, SquarePen, Trash2, RotateCcw } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { idbListChatSessions, idbReadChatSession, idbWriteChatSession, idbWriteChatMessage, idbDeleteChatSession, type ChatMessage, type ChatSession } from "@/lib/idb";
import { pushUserData, loadAndRestoreUserData, pushPlanningChatSessions, loadAndRestorePlanningChat, pushTasksBackup, loadAndRestoreTasksBackup } from "@/lib/sync";
import { patchTaskSchedule } from "@/lib/taskStorage";
import { useAgentIdentity } from "@/lib/agentIdentity";
import { normalizeSkill, SKILL_LABELS, type SkillId } from "@/lib/skills";
import { RouteComparisonCard } from "@/components/routes/RouteComparisonCard";
import { CalendarSummaryCard } from "@/components/calendar/CalendarSummaryCard";
import { TransportHubsCard } from "@/components/routes/TransportHubsCard";
import { WebSearchCard } from "@/components/chat/WebSearchCard";
import { CollapsibleToolCard } from "@/components/chat/CollapsibleToolCard";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CalendarEventProposalCard } from "@/components/calendar/CalendarEventProposalCard";
import { ComposerPlusMenu } from "@/components/chat/ComposerPlusMenu";
import { ContextChip, type ContextChipData } from "@/components/chat/ContextChip";
import { CalendarEventPickerSheet } from "@/components/chat/CalendarEventPickerSheet";
import { SavedAddressPickerSheet } from "@/components/chat/SavedAddressPickerSheet";
import type { EventChip } from "@/components/chat/ContextChip";
import type { AddressChip } from "@/components/chat/ContextChip";
import styles from "@/components/ui/FloatingPanel.module.css";
import { sendTutorialMessage } from "@/lib/tutorial-ai/provider";
import { ReadAloudButton, stopReadAloud } from "@/components/ui/ReadAloudButton";
import { hasNativeSpeechRecognition, prepareOnDeviceTranscription, startLocalRecording, subscribeOnDeviceTranscription, transcribeLocally, type LocalRecording } from "@/lib/speech/onDeviceTranscription";
import { postToSW } from "@/lib/sw";

type ToolCall = { toolCallId: string; toolName: string; args: Record<string, unknown>; result?: string };

type UiAction =
  | { type: "flag_task"; taskId: string; source: "google" }
  | { type: "unflag_task" }
  | { type: "schedule_task"; taskId: string; scheduledFor: string }
  | { type: "refresh_tasks" }
  | { type: "refresh_events" }
  | { type: "refresh_addresses" };

type FloatingAssistantProps = Readonly<{
  onFlagTask?: (taskId: string, source: "google") => void;
  onUnflagTask?: () => void;
  onScheduleTask?: (taskId: string, scheduledFor: string) => void;
  onAgentAction?: () => void;
}>;

type RetryRequest = { message: string; skill: SkillId };
type DisplayMessage = { role: "user" | "assistant"; content: string; ts: number; toolCalls?: ToolCall[]; retryRequest?: RetryRequest };
type PendingChat = { sendTs: number; request: RetryRequest; sessionId: string; messageIndex: number };

const TASK_TOOL_NAMES = new Set([
  "get_all_tasks", "get_google_tasks",
]);

const mdComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
  h1: ({ children }: { children?: React.ReactNode }) => <p style={{ fontWeight: 700, fontSize: "1.1em", margin: "8px 0 4px" }}>{children}</p>,
  h2: ({ children }: { children?: React.ReactNode }) => <p style={{ fontWeight: 700, fontSize: "1.05em", margin: "8px 0 4px" }}>{children}</p>,
  h3: ({ children }: { children?: React.ReactNode }) => <p style={{ fontWeight: 600, margin: "6px 0 2px" }}>{children}</p>,
  h4: ({ children }: { children?: React.ReactNode }) => <p style={{ fontWeight: 600, margin: "4px 0 2px" }}>{children}</p>,
  hr: () => <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "8px 0" }} />,
  ul: ({ children }: { children?: React.ReactNode }) => <ul style={{ margin: "6px 0", paddingLeft: 18 }}>{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol style={{ margin: "6px 0", paddingLeft: 18 }}>{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong>{children}</strong>,
  code: ({ children }: { children?: React.ReactNode }) => (
    <code style={{ padding: "1px 4px", borderRadius: 4, fontSize: "0.8em", overflowWrap: "break-word", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre style={{ margin: "6px 0", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: "100%", background: "#000", color: "#fff" }}>{children}</pre>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)", textDecoration: "underline", cursor: "pointer" }}>{children}</a>
  ),
};

function ToolCallCards({ toolCalls }: { toolCalls: ToolCall[] }) {
  return (
    <>
      {toolCalls.map((tc) => {
        if (!tc.result) return null;
        if (tc.toolName.endsWith("compare_routes")) {
          try { return <RouteComparisonCard key={tc.toolCallId} result={JSON.parse(tc.result)} />; } catch { return null; }
        }
        if (tc.toolName.endsWith("get_calendar_events")) {
          return <CalendarSummaryCard key={tc.toolCallId} result={tc.result} />;
        }
        if (tc.toolName.endsWith("find_nearby_transport_hubs")) {
          const args = tc.args as { location?: string };
          return <TransportHubsCard key={tc.toolCallId} result={tc.result} location={args.location ?? ""} />;
        }
        if (tc.toolName.endsWith("search_web") || tc.toolName === "WebSearch") {
          const args = tc.args as { query?: string };
          return <CollapsibleToolCard key={tc.toolCallId} icon={<span>🔍</span>} title="Web Search" subtitle={args.query ?? ""}><WebSearchCard result={tc.result} query={args.query ?? ""} toolName={tc.toolName} /></CollapsibleToolCard>;
        }
        if ([...TASK_TOOL_NAMES].some((n) => tc.toolName.endsWith(n))) {
          return <TaskCard key={tc.toolCallId} result={tc.result} toolName={tc.toolName} />;
        }
        if (tc.toolName.endsWith("propose_calendar_event")) {
          const args = tc.args as { calendarId: string; title: string; start: string; end: string; description?: string; location?: string };
          if (!args.title || !args.start || !args.end) return null;
          return <CalendarEventProposalCard key={tc.toolCallId} args={args} />;
        }
        return null;
      })}
    </>
  );
}


export function FloatingAssistant({ onFlagTask, onUnflagTask, onScheduleTask, onAgentAction }: FloatingAssistantProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const { name: agentName, icon: agentIcon } = useAgentIdentity();
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chips, setChips] = useState<ContextChipData[]>([]);
  const [skill, setSkill] = useState<SkillId>("general");
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const msgIndexRef = useRef<number>(0);
  const pendingChatRef = useRef(new Map<string, PendingChat>());
  const loadSession = useCallback(async (sessionId: string): Promise<boolean> => {
    const data = await idbReadChatSession(sessionId);
    if (!data) return false;
    const failedUserIndexes = new Set<number>();
    let mostRecentUser: ChatMessage | null = null;
    for (const message of data.messages) {
      if (message.role === "user") mostRecentUser = message;
      if (message.role === "assistant" && message.status === "failed" && mostRecentUser) {
        failedUserIndexes.add(mostRecentUser.index);
      }
    }
    const lastStoredMessage = data.messages.at(-1);
    if (lastStoredMessage?.role === "user") failedUserIndexes.add(lastStoredMessage.index);
    const sessionSkill = normalizeSkill(data.session.skill);
    const display: DisplayMessage[] = data.messages
      .filter((m: ChatMessage) => m.role === "user" || m.role === "assistant")
      .map((m: ChatMessage) => ({
        role: m.role,
        content: m.message,
        ts: m.createdAt,
        toolCalls: m.toolCalls,
        retryRequest: m.role === "user" && failedUserIndexes.has(m.index)
          ? { message: m.message, skill: sessionSkill }
          : undefined,
      }));
    setMessages(display);
    setActiveSessionId(sessionId);
    sessionIdRef.current = sessionId;
    msgIndexRef.current = data.messages.length;
    if (data.session.skill) setSkill(sessionSkill);
    return true;
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 100);
    loadAndRestorePlanningChat().then(() => idbListChatSessions()).then(async (all) => {
      setSessions(all);
      if (all.length === 0) return;
      await loadSession(all[0].id);
    }).catch(() => {});
  }, [open, loadSession]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, sending]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  useEffect(() => {
    const channel = new BroadcastChannel("route-jobs");
    const onMessage = (event: MessageEvent<{
      type?: string;
      jobId?: string;
      status?: string;
      partial?: string;
      toolCalls?: ToolCall[];
      uiAction?: UiAction;
      actions?: Array<{ action: string; route?: string; [key: string]: unknown }>;
    }>) => {
      const update = event.data;
      if ((update.type !== "CHAT_UPDATE" && update.type !== "CHAT_404") || !update.jobId) return;
      const pending = pendingChatRef.current.get(update.jobId);
      if (!pending) return;

      const updateAssistant = (content: string, toolCalls?: ToolCall[]) => {
        setMessages((previous) => {
          const index = previous.findIndex((message) => message.ts === pending.sendTs + 1);
          if (index < 0) return [...previous, { role: "assistant", content, ts: pending.sendTs + 1, toolCalls }];
          const next = [...previous];
          next[index] = { ...next[index], content, toolCalls: toolCalls ?? next[index].toolCalls };
          return next;
        });
      };

      if (update.type === "CHAT_UPDATE" && update.status === "running") {
        if (update.partial || update.toolCalls?.length) updateAssistant(update.partial ?? "", update.toolCalls);
        return;
      }

      if (update.type === "CHAT_UPDATE" && update.status === "completed") {
        pendingChatRef.current.delete(update.jobId);
        const result = update.partial ?? "";
        updateAssistant(result, update.toolCalls ?? []);
        for (const action of update.actions ?? []) {
          if (action.action === "navigate" && typeof action.route === "string") router.push(action.route);
          else window.dispatchEvent(new CustomEvent("agent-action", { detail: action }));
        }
        if (update.uiAction?.type === "flag_task") {
          onFlagTask?.(update.uiAction.taskId, update.uiAction.source);
        } else if (update.uiAction?.type === "unflag_task") {
          onUnflagTask?.();
        } else if (update.uiAction?.type === "schedule_task") {
          const { taskId, scheduledFor } = update.uiAction;
          void patchTaskSchedule(taskId, { scheduledFor }).then(() => onScheduleTask?.(taskId, scheduledFor));
        }
        pushPlanningChatSessions().catch((error) => console.warn("[assistant] failed to push chat history:", error));
        void Promise.all([loadAndRestoreUserData(), loadAndRestoreTasksBackup(), loadAndRestorePlanningChat()]);
        onAgentAction?.();
        setChips([]);
        setSending(false);
        inputRef.current?.focus();
        return;
      }

      if (update.type === "CHAT_404" || (update.type === "CHAT_UPDATE" && update.status === "failed")) {
        pendingChatRef.current.delete(update.jobId);
        const failure = "Couldn't reach the assistant — try again.";
        updateAssistant(failure);
        setMessages((previous) => previous.map((message) =>
          message.ts === pending.sendTs ? { ...message, retryRequest: pending.request } : message
        ));
        if (update.type === "CHAT_404") {
          void idbWriteChatMessage(pending.sessionId, pending.messageIndex, "assistant", failure, undefined, "failed");
        }
        setSending(false);
        inputRef.current?.focus();
      }
    };
    channel.addEventListener("message", onMessage);
    return () => channel.close();
  }, [onAgentAction, onFlagTask, onScheduleTask, onUnflagTask, router]);

  const handleSend = async (retryRequest?: RetryRequest) => {
    const msg = (retryRequest?.message ?? text).trim();
    if (!msg || sending) return;
    const selectedSkill = retryRequest?.skill ?? skill;
    setSending(true);
    setText("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const sendTs = Date.now();
    const userMsg: DisplayMessage = { role: "user", content: msg, ts: sendTs };
    setMessages((prev) => [...prev, userMsg]);

    if (!sessionIdRef.current) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sendTs.toString()));
      sessionIdRef.current = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
      msgIndexRef.current = 0;
      await idbWriteChatSession(sessionIdRef.current, sendTs, undefined, msg.slice(0, 80), selectedSkill);
      setActiveSessionId(sessionIdRef.current);
      idbListChatSessions().then(setSessions).catch(() => {});
    }
    const userIndex = msgIndexRef.current;
    msgIndexRef.current += 1;
    await idbWriteChatMessage(sessionIdRef.current, userIndex, "user", msg);
    const request = { message: msg, skill: selectedSkill };
    const markRequestRetryable = () => {
      setMessages((prev) => prev.map((message) => message.ts === sendTs ? { ...message, retryRequest: request } : message));
    };
    const recordFailure = async (content: string) => {
      markRequestRetryable();
      const failedAt = Date.now();
      if (sessionIdRef.current) {
        const assistantIndex = msgIndexRef.current;
        msgIndexRef.current += 1;
        try {
          await idbWriteChatMessage(sessionIdRef.current, assistantIndex, "assistant", content, undefined, "failed");
        } catch {
          // The retry control remains usable for this open chat even if local persistence is unavailable.
        }
      }
      setMessages((prev) => [...prev, { role: "assistant", content, ts: failedAt }]);
    };

    // Tutorial mode: answer in browser, skip the backend entirely.
    // Executive Assistant messages go to the connected Strands service.
    if (selectedSkill === "general") {
      try {
        const history = [...messages, userMsg].map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
        const response = await sendTutorialMessage(history);
        for (const action of (response.actions ?? [])) {
          if (action.type === "navigate") router.push(action.route);
        }
        const asstIdx = msgIndexRef.current;
        msgIndexRef.current += 1;
        await idbWriteChatMessage(sessionIdRef.current!, asstIdx, "assistant", response.text, undefined, "completed");
        setMessages((prev) => [...prev, { role: "assistant", content: response.text, ts: Date.now() }]);
      } catch {
        setMessages((prev) => [...prev, { role: "assistant", content: "Setup guide encountered an error — please try again.", ts: Date.now() }]);
      } finally {
        setSending(false);
        inputRef.current?.focus();
      }
      return;
    }

    let handedToServiceWorker = false;
    try {
      await Promise.all([pushUserData(), pushTasksBackup(), pushPlanningChatSessions()]);
      const now = new Date().toLocaleString(undefined, {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "2-digit", timeZoneName: "short",
      });

      let chipContext = "";
      if (chips.length > 0) {
        const lines = chips.map((c) => {
          if (c.kind === "event") {
            const s = new Date(c.start);
            const e = new Date(c.end);
            const fmt = (d: Date) => d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
            return `- Calendar event "${c.title}" (${fmt(s)} – ${e.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })})`;
          }
          return `- Address "${c.label}": ${c.address}`;
        });
        chipContext = `\n\n[Attached context:\n${lines.join("\n")}]`;
      }

      const startRes = await proxyFetch("/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Today: ${now} - ${msg}${chipContext}`, skill: selectedSkill, agentName, sessionId: sessionIdRef.current }),
      });
      const startData = (await startRes.json()) as { jobId?: string; error?: string };
      if (!startRes.ok || !startData.jobId) {
        const rawErr = startData.error ?? "";
        const errMsg = rawErr.toLowerCase().includes("no claude backend")
          ? "The Executive Assistant service is not available yet. Please try again later."
          : rawErr || "Something went wrong. Please try again.";
        await recordFailure(errMsg);
        setSending(false);
        return;
      }
      const { jobId } = startData;
      const assistantIndex = msgIndexRef.current;
      msgIndexRef.current += 1;
      pendingChatRef.current.set(jobId, {
        sendTs,
        request,
        sessionId: sessionIdRef.current!,
        messageIndex: assistantIndex,
      });
      await postToSW({
        type: "START_CHAT_POLL",
        jobId,
        sessionId: sessionIdRef.current,
        messageIndex: assistantIndex,
        message: msg,
      });
      setChips([]);
      handedToServiceWorker = true;
    } catch {
      await recordFailure("Couldn't reach the assistant — try again.");
    } finally {
      if (!handedToServiceWorker) {
        setSending(false);
        inputRef.current?.focus();
      }
    }
  };

  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micStatus, setMicStatus] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const localRecordingRef = useRef<LocalRecording | null>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    return subscribeOnDeviceTranscription((status, progress) => {
      if (status === "downloading") setMicStatus(`Downloading local dictation model… ${progress ?? 0}%`);
      if (status === "ready") setMicStatus("Local dictation is ready");
      if (status === "failed") setMicStatus("Local dictation could not start. Please type instead.");
    });
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      localRecordingRef.current?.cancel();
      stopReadAloud();
    };
  }, []);

  const appendTranscript = useCallback((transcript: string) => {
    if (transcript) setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
  }, []);

  const stopLocalDictation = useCallback(async () => {
    const recording = localRecordingRef.current;
    if (!recording) return;
    localRecordingRef.current = null;
    setListening(false);
    setTranscribing(true);
    setMicStatus("Transcribing on this device…");
    try {
      const audio = await recording.stop();
      appendTranscript(await transcribeLocally(audio));
      setMicStatus(null);
    } catch {
      setMicStatus("Local dictation could not finish. Please try again.");
    } finally {
      setTranscribing(false);
    }
  }, [appendTranscript]);

  const startLocalDictation = useCallback(async () => {
    try {
      const recording = await startLocalRecording();
      localRecordingRef.current = recording;
      setListening(true);
      setMicStatus("Listening on this device…");
    } catch {
      setMicStatus("Microphone access is needed for local dictation.");
    }
  }, []);

  const startNativeDictation = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR || !hasNativeSpeechRecognition()) {
      setMicStatus("Browser dictation is not available on this device.");
      return;
    }
    try {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      transcriptRef.current = "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (e: any) => { transcriptRef.current = e.results[e.results.length - 1]?.[0]?.transcript ?? ""; };
      rec.onend = () => {
        const t = transcriptRef.current;
        appendTranscript(t);
        transcriptRef.current = "";
        setListening(false);
        setMicStatus(null);
      };
      rec.onerror = () => { transcriptRef.current = ""; setListening(false); setMicStatus("Voice input could not hear that. Please try again."); };
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
      setMicStatus("Listening…");
    } catch {
      recognitionRef.current = null;
      setMicStatus("Browser dictation could not start. Please try again.");
    }
  }, [appendTranscript]);

  const handleMic = useCallback(() => {
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
      setMicStatus("Preparing browser dictation…");
      const browserModel = await prepareOnDeviceTranscription();
      if (browserModel) {
        await startLocalDictation();
      } else {
        startNativeDictation();
      }
    })();
  }, [listening, startLocalDictation, startNativeDictation, stopLocalDictation, transcribing]);

  useEffect(() => {
    const openFromDashboard = (event: Event) => {
      setOpen(true);
      if (!(event instanceof CustomEvent) || event.detail?.voice !== true) return;
      window.setTimeout(() => handleMic(), 0);
    };
    window.addEventListener("open-agent-assistant", openFromDashboard);
    return () => window.removeEventListener("open-agent-assistant", openFromDashboard);
  }, [handleMic]);

  return (
    <>
      <CalendarEventPickerSheet
        open={showEventPicker}
        onClose={() => setShowEventPicker(false)}
        onConfirm={(events: EventChip[]) => {
          setChips((prev) => [...prev, ...events.filter((e) => !prev.some((p) => p.id === e.id))]);
          setShowEventPicker(false);
        }}
      />
      <SavedAddressPickerSheet
        open={showAddressPicker}
        onClose={() => setShowAddressPicker(false)}
        onConfirm={(addrs: AddressChip[]) => {
          setChips((prev) => [...prev, ...addrs.filter((a) => !prev.some((p) => p.id === a.id))]);
          setShowAddressPicker(false);
        }}
      />

      <button type="button" aria-label={`Open ${agentName} assistant`} onClick={() => { setOpen((v) => { if (v) { sessionIdRef.current = null; msgIndexRef.current = 0; } return !v; }); }} className={styles.fab}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={agentIcon ?? "/trippy-transparent.png"} alt={agentName} className={styles.headerIcon} />
      </button>

      {open && (
        <>
          <div className={styles.overlay} onClick={() => setOpen(false)} />
          <div className={styles.panel}>
            <div className={styles.header}>
              <button type="button" aria-label={showHistory ? "Back to chat" : "Chat history"} onClick={() => setShowHistory((v) => !v)} className={styles.iconBtn}>
                {showHistory ? <ChevronLeft size={16} /> : <History size={16} />}
              </button>
              {!showHistory && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={agentIcon ?? "/trippy-transparent.png"} alt={agentName} className={styles.headerIcon} />
              )}
              <span className={styles.headerTitle}>{showHistory ? "Past conversations" : agentName}</span>
              <div className={styles.headerActions}>
                {!showHistory && (
                  <button type="button" aria-label="New chat" onClick={() => { setMessages([]); setChips([]); sessionIdRef.current = null; msgIndexRef.current = 0; setActiveSessionId(null); }} className={styles.iconBtn}>
                    <SquarePen size={16} />
                  </button>
                )}
                <button type="button" aria-label="Close" onClick={() => setOpen(false)} className={styles.iconBtn}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {showHistory ? (
              <div className={styles.sessionList}>
                {sessions.length === 0 && (
                  <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", textAlign: "center", marginTop: 16 }}>
                    No past conversations yet.
                  </p>
                )}
                {sessions.length > 0 && (() => {
                  const groups = sessions.reduce<Record<string, typeof sessions>>((acc, s) => {
                    const key = normalizeSkill(s.skill);
                    (acc[key] ??= []).push(s);
                    return acc;
                  }, {});
                  return Object.entries(groups).map(([skillKey, group]) => (
                    <React.Fragment key={skillKey}>
                      <span className={styles.sessionGroupLabel}>{SKILL_LABELS[skillKey] ?? skillKey}</span>
                      {group.map((s) => (
                        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4, width: "100%", minWidth: 0 }}>
                          <button type="button" className={`${styles.sessionRow} ${s.id === activeSessionId ? styles.sessionRowActive : ""}`} style={{ flex: 1, minWidth: 0 }} onClick={async () => { const ok = await loadSession(s.id); if (ok) setShowHistory(false); }}>
                            <span className={styles.sessionTitle}>{s.title ? (s.title.length > 60 ? s.title.slice(0, 60) + "…" : s.title) : "Untitled conversation"}</span>
                            <span className={styles.sessionDate}>{new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                          </button>
                          <button
                            type="button"
                            aria-label="Delete conversation"
                            className={styles.iconBtn}
                            style={{ flexShrink: 0, color: "var(--color-text-muted)" }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              await Promise.all([
                                idbDeleteChatSession(s.id),
                                proxyFetch(`/agent/chat/sessions/${s.id}`, { method: "DELETE" }).catch(() => {}),
                              ]);
                              setSessions((prev) => prev.filter((x) => x.id !== s.id));
                              if (s.id === activeSessionId) {
                                setMessages([]);
                                sessionIdRef.current = null;
                                msgIndexRef.current = 0;
                                setActiveSessionId(null);
                              }
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </React.Fragment>
                  ));
                })()}
              </div>
            ) : (
              <>
                <div className={styles.body} ref={bodyRef}>
                  {messages.length === 0 && !sending && (
                    <div className={styles.emptyState}>
                      <div className={styles.skillPicker}>
                        <button
                          type="button"
                          onClick={() => setSkill("general")}
                          className={`${styles.skillBtn} ${skill === "general" ? styles.skillBtnActive : ""}`}
                        >
                          <span className={styles.skillEmoji}>💬</span>
                          <span>Tutorial</span>
                        </button>
                        <div className={styles.skillDivider}>choose an agent</div>
                        <button
                          type="button"
                          onClick={() => setSkill("executive-assistant")}
                          className={`${styles.skillBtn} ${skill === "executive-assistant" ? styles.skillBtnActive : ""}`}
                        >
                          <span className={styles.skillEmoji}>📋</span>
                          <span>Executive Assistant</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={styles.messageGroup}>
                      <div className={m.role === "user" ? styles.userBubble : styles.responseBubble}>
                        <Markdown remarkPlugins={[remarkGfm]} components={mdComponents}>{m.content}</Markdown>
                      </div>
                      {m.role === "assistant" && (
                        <div className={styles.assistantActions}>
                          <div className={styles.messageActionButtons}>
                            <ReadAloudButton
                              text={m.content}
                              className={styles.ttsBtn}
                              iconSize={14}
                            />
                          </div>
                          {m.ts && <span className={styles.msgTs}>{new Date(m.ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
                        </div>
                      )}
                      {m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0 && (
                        <ToolCallCards toolCalls={m.toolCalls} />
                      )}
                      {m.role === "user" && (
                        <div className={styles.userMessageActions}>
                          {m.retryRequest && (
                            <button type="button" onClick={() => void handleSend(m.retryRequest)} disabled={sending} className={styles.retryBtn}>
                              <RotateCcw size={13} /> Retry
                            </button>
                          )}
                          {m.ts && <span className={styles.msgTsUser}>{new Date(m.ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                  {sending && (
                    <div className={styles.thinking}>
                      <div className={styles.dot} />
                      <div className={styles.dot} />
                      <div className={styles.dot} />
                    </div>
                  )}
                </div>

                <div className={styles.composer}>
                  <div className={styles.inputWrap}>
                    <div className={styles.chipRow}>
                      <ComposerPlusMenu
                        onSelectCalendarEvent={() => setShowEventPicker(true)}
                        onSelectSavedAddress={() => setShowAddressPicker(true)}
                      />
                      {chips.map((c) => (
                        <ContextChip key={c.id} chip={c} onRemove={() => setChips((prev) => prev.filter((p) => p.id !== c.id))} />
                      ))}
                    </div>
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={text}
                      onChange={(e) => {
                        const val = skill === "general" ? e.target.value.slice(0, 200) : e.target.value;
                        setText(val);
                        const el = e.target;
                        el.style.height = "auto";
                        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={`Ask ${agentName}…`}
                      className={styles.input}
                      disabled={sending}
                    />
                    <button type="button" aria-label={transcribing ? "Transcribing voice input" : listening ? "Stop listening" : "Voice input"} onClick={handleMic} disabled={transcribing} className={styles.inlineIconBtn}>
                      {transcribing || listening ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    {micStatus && <span className={styles.speechStatus} role="status">{micStatus}</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                  <button type="button" aria-label="Send" onClick={handleSend} disabled={!text.trim() || sending} className={styles.sendBtn}>
                    {sending
                      ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.6s linear infinite", display: "block" }} />
                      : <ArrowUp size={16} />}
                  </button>
                  {skill === "general" && text.length > 0 && (
                    <span style={{ fontSize: "0.65rem", color: text.length >= 180 ? "var(--color-error, #e55)" : "var(--color-text-muted)" }}>
                      {text.length}/200
                    </span>
                  )}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
