"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Volume2, VolumeOff } from "lucide-react";
import { speakNaturally, stopSpeaking, type NaturalSpeechStatus } from "@/lib/speech/localSpeech";

type ReadAloudButtonProps = {
  text: string;
  className?: string;
  style?: CSSProperties;
  iconSize?: number;
};

let nextButtonId = 1;
let activeButtonId: number | null = null;
const listeners = new Set<(activeId: number | null) => void>();

function setActiveButton(activeId: number | null) {
  activeButtonId = activeId;
  listeners.forEach((listener) => listener(activeId));
}

export function stopReadAloud(): void {
  stopSpeaking();
  setActiveButton(null);
}

// "speaking" isn't shown here at all — the button's own icon flip (Volume2 ->
// VolumeOff) already communicates that, and a toast that keeps re-rendering
// for the whole length of the speech would just be noise.
const STATUS_LABEL: Partial<Record<NaturalSpeechStatus, string>> = {
  preparing: "Loading natural voice…",
  generating: "Generating speech…",
  "system-voice": "Using system voice",
};

// How long the "system-voice" toast stays up. Unlike preparing/generating —
// which clear on their own the moment the next real status arrives — system
// voice playback starts immediately, so without a timer this would otherwise
// only disappear when the whole utterance finishes.
const SYSTEM_VOICE_TOAST_MS = 2500;

/** Shared control for reading a context-specific piece of visible text aloud. */
export function ReadAloudButton({ text, className, style, iconSize = 15 }: Readonly<ReadAloudButtonProps>) {
  const idRef = useRef<number | null>(null);
  if (idRef.current === null) idRef.current = nextButtonId++;
  const id = idRef.current;
  const [speaking, setSpeaking] = useState(() => activeButtonId === id);
  const [status, setStatus] = useState<{ label: string; progress?: number } | null>(null);
  const systemVoiceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const listener = (activeId: number | null) => setSpeaking(activeId === id);
    listeners.add(listener);
    listener(activeButtonId);
    return () => {
      listeners.delete(listener);
      if (activeButtonId === id) setActiveButton(null);
    };
  }, [id]);

  const clearSystemVoiceTimer = useCallback(() => {
    if (systemVoiceTimerRef.current !== null) {
      window.clearTimeout(systemVoiceTimerRef.current);
      systemVoiceTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearSystemVoiceTimer(), [clearSystemVoiceTimer]);

  const handleSpeak = useCallback(() => {
    if (speaking) {
      stopReadAloud();
      setStatus(null);
      clearSystemVoiceTimer();
      return;
    }

    const readableText = text.trim();
    if (!readableText) return;
    setActiveButton(id);
    void speakNaturally(readableText, {
      onStatus: (nextStatus, progress) => {
        if (activeButtonId !== id) return;
        clearSystemVoiceTimer();
        if (nextStatus === "speaking") {
          setStatus(null);
          return;
        }
        const label = STATUS_LABEL[nextStatus];
        if (!label) return;
        setStatus({ label, progress });
        if (nextStatus === "system-voice") {
          systemVoiceTimerRef.current = window.setTimeout(() => {
            if (activeButtonId === id) setStatus(null);
          }, SYSTEM_VOICE_TOAST_MS);
        }
      },
      onEnd: () => {
        if (activeButtonId === id) setActiveButton(null);
        setStatus(null);
        clearSystemVoiceTimer();
      },
      onError: () => {
        if (activeButtonId === id) setActiveButton(null);
        setStatus(null);
        clearSystemVoiceTimer();
      },
    }).then((started) => {
      if (!started && activeButtonId === id) {
        setActiveButton(null);
        setStatus(null);
      }
    });
  }, [clearSystemVoiceTimer, id, speaking, text]);

  return (
    <>
      <button
        type="button"
        aria-label={speaking ? "Stop reading" : "Read aloud"}
        onClick={handleSpeak}
        className={className}
        style={style}
      >
        {speaking ? <VolumeOff size={iconSize} /> : <Volume2 size={iconSize} />}
      </button>
      {status && (
        // Fixed to the viewport corner, not anchored to the button: only one
        // instance can ever be active at a time (activeButtonId is a single
        // module-level value shared by every ReadAloudButton), and a
        // button-relative tooltip gets clipped or overlapped in narrow
        // viewports and inside modals. A corner toast is never in the way of
        // whatever the button itself sits on top of.
        <span
          role="status"
          style={{
            position: "fixed",
            top: "calc(env(safe-area-inset-top, 0px) + 16px)",
            right: "calc(env(safe-area-inset-right, 0px) + 16px)",
            padding: "8px 14px",
            borderRadius: 8,
            background: "#1f1f1f",
            color: "#fff",
            fontSize: 13,
            lineHeight: 1.4,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            zIndex: 2147483647,
            pointerEvents: "none",
          }}
        >
          {status.label}
          {typeof status.progress === "number" ? ` ${Math.round(status.progress * 100)}%` : ""}
        </span>
      )}
    </>
  );
}
