"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  hasNativeSpeechRecognition,
  prepareOnDeviceTranscription,
  startLocalRecording,
  subscribeOnDeviceTranscription,
  transcribeLocally,
  type LocalRecording,
} from "@/lib/speech/onDeviceTranscription";

export type MicrophoneState = {
  listening: boolean;
  transcribing: boolean;
  micStatus: string | null;
  handleMic: () => void;
};

/**
 * Reusable hook that encapsulates all mic/speech recognition logic.
 * Handles both native browser SpeechRecognition and on-device transcription fallback.
 */
export function useMicrophone(onTranscript: (text: string) => void): MicrophoneState {
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
    };
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
      const text = await transcribeLocally(audio);
      onTranscript(text);
      setMicStatus(null);
    } catch {
      setMicStatus("Local dictation could not finish. Please try again.");
    } finally {
      setTranscribing(false);
    }
  }, [onTranscript]);

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
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      rec.onresult = (e: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => {
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
      setMicStatus("Listening…");
    } catch {
      recognitionRef.current = null;
      setMicStatus("Browser dictation could not start. Please try again.");
    }
  }, [onTranscript]);

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

  return { listening, transcribing, micStatus, handleMic };
}
