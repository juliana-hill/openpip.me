"use client";

import { useCallback, useRef, useState } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
  }
}

/** Browser-only voice input enhancement; typing always remains available. */
export function useMicrophone(onTranscript: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micStatus, setMicStatus] = useState<string | null>(null);

  const handleMic = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setMicStatus("Voice input is not available in this browser.");
      return;
    }
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.trim();
      if (text) onTranscript(text);
    };
    recognition.onerror = () => setMicStatus("Voice input could not be captured.");
    recognition.onend = () => {
      setListening(false);
      setTranscribing(false);
    };
    recognitionRef.current = recognition;
    setMicStatus(null);
    setListening(true);
    setTranscribing(true);
    recognition.start();
  }, [listening, onTranscript]);

  return { listening, transcribing, micStatus, handleMic };
}
