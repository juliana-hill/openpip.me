"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Volume2, VolumeOff } from "lucide-react";
import { speakNaturally, stopSpeaking } from "@/lib/speech/localSpeech";

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

/** Shared control for reading a context-specific piece of visible text aloud. */
export function ReadAloudButton({ text, className, style, iconSize = 15 }: Readonly<ReadAloudButtonProps>) {
  const idRef = useRef<number | null>(null);
  if (idRef.current === null) idRef.current = nextButtonId++;
  const id = idRef.current;
  const [speaking, setSpeaking] = useState(() => activeButtonId === id);

  useEffect(() => {
    const listener = (activeId: number | null) => setSpeaking(activeId === id);
    listeners.add(listener);
    listener(activeButtonId);
    return () => {
      listeners.delete(listener);
      if (activeButtonId === id) setActiveButton(null);
    };
  }, [id]);

  const handleSpeak = useCallback(() => {
    if (speaking) {
      stopReadAloud();
      return;
    }

    const readableText = text.trim();
    if (!readableText) return;
    setActiveButton(id);
    void speakNaturally(readableText, {
      onEnd: () => { if (activeButtonId === id) setActiveButton(null); },
      onError: () => { if (activeButtonId === id) setActiveButton(null); },
    }).then((started) => {
      if (!started && activeButtonId === id) setActiveButton(null);
    });
  }, [id, speaking, text]);

  return (
    <button
      type="button"
      aria-label={speaking ? "Stop reading" : "Read aloud"}
      onClick={handleSpeak}
      className={className}
      style={style}
    >
      {speaking ? <VolumeOff size={iconSize} /> : <Volume2 size={iconSize} />}
    </button>
  );
}
