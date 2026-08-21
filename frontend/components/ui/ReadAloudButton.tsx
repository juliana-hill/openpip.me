"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/speech";

export function ReadAloudButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => stopSpeaking(), []);
  function toggle() {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    setSpeaking(speak(text, () => setSpeaking(false)));
  }
  return <button type="button" className="read-aloud-button" onClick={toggle} aria-label={speaking ? "Stop reading briefing" : "Read briefing aloud"}>{speaking ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>;
}
