"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { useMicrophone } from "@/hooks/useMicrophone";
import styles from "./PromptModal.module.css";

type PromptModalProps = {
  open: boolean;
  title: string;
  placeholder?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

/**
 * Reusable modal with a text input + mic button.
 * Replaces window.prompt() with a styled, voice-enabled prompt.
 */
export function PromptModal({ open, title, placeholder, submitLabel = "Submit", cancelLabel = "Cancel", onSubmit, onCancel }: PromptModalProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const appendTranscript = useCallback((text: string) => {
    setValue((prev) => (prev ? prev + " " + text : text));
  }, []);

  const { listening, transcribing, micStatus, handleMic } = useMicrophone(appendTranscript);

  useEffect(() => {
    if (open) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>
          <textarea
            ref={inputRef}
            className={styles.input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? "Type or use the mic…"}
            rows={3}
          />
          <div className={styles.inputFooter}>
            <button
              type="button"
              className={`${styles.micBtn} ${listening || transcribing ? styles.micActive : ""}`}
              onClick={handleMic}
              disabled={transcribing}
              aria-label={transcribing ? "Transcribing" : listening ? "Stop listening" : "Voice input"}
            >
              {transcribing || listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            {micStatus && <span className={styles.micStatus}>{micStatus}</span>}
          </div>
        </div>
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onCancel}>{cancelLabel}</button>
          <button className={styles.submitBtn} onClick={handleSubmit}>{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}
