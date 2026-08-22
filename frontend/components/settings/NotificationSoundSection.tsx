"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { idbGetUserPrefs, idbSetUserPrefs } from "@/lib/idb";
import { pushUserData } from "@/lib/sync";
import {
  SOUND_NAMES,
  SOUND_LABELS,
  SOUND_DESCRIPTIONS,
  PITCH_LABELS,
  playSound,
  normalizeSound,
  type SoundName,
  type PitchOctave,
} from "@/lib/sounds";


export function NotificationSoundSection() {
  const [sound, setSound]   = useState<SoundName>("chime");
  const [volume, setVolume] = useState(80);
  const [pitch, setPitch]   = useState<PitchOctave>(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    idbGetUserPrefs().then((prefs) => {
      setSound(normalizeSound(prefs.notificationSound ?? null));
      setVolume(prefs.notificationVolume ? parseInt(prefs.notificationVolume, 10) : 80);
      setPitch(prefs.notificationPitch ? (parseInt(prefs.notificationPitch, 10) as PitchOctave) : 0);
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const selectSound = async (name: SoundName) => {
    setSound(name);
    await idbSetUserPrefs({ notificationSound: name });
    void pushUserData();
  };

  const changeVolume = async (val: number) => {
    setVolume(val);
    await idbSetUserPrefs({ notificationVolume: String(val) });
    void pushUserData();
  };

  const changePitch = async (val: PitchOctave) => {
    setPitch(val);
    await idbSetUserPrefs({ notificationPitch: String(val) });
    void pushUserData();
  };

  const preview = (name: SoundName) => {
    if (name === "none") return;
    playSound(name, { volume: volume / 100, pitch });
  };

  if (!loaded) return null;

  return (
    <section>
      <h2 style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-muted)", marginBottom: 16 }}>
        Notifications
      </h2>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {/* Sound picker */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", marginBottom: 12 }}>Notification sound</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 6 }}>
            {SOUND_NAMES.map((name) => {
              const selected = sound === name;
              return (
                <div
                  key={name}
                  onClick={() => void selectSound(name)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "8px 12px", borderRadius: "var(--radius-md)", cursor: "pointer",
                    background: selected ? "var(--color-accent-light)" : "transparent",
                    outline: selected ? "1px solid var(--color-accent)" : "none",
                    transition: "background 150ms ease",
                  }}
                >
                  {/* Radio dot */}
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                    border: selected ? "2px solid var(--color-accent)" : "2px solid var(--color-text-muted)",
                    background: selected ? "var(--color-accent)" : "transparent",
                    transition: "border-color 150ms ease, background 150ms ease",
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", margin: 0 }}>
                      {SOUND_LABELS[name]}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.3, margin: 0 }}>
                      {SOUND_DESCRIPTIONS[name]}
                    </p>
                  </div>
                  {name !== "none" && (
                    <button
                      type="button"
                      aria-label={`Preview ${SOUND_LABELS[name]}`}
                      onClick={(e) => { e.stopPropagation(); preview(name); }}
                      style={{
                        flexShrink: 0, padding: 6, borderRadius: "var(--radius-md)",
                        border: "none", background: "transparent", cursor: "pointer",
                        color: "var(--color-text-muted)", transition: "background 150ms ease, color 150ms ease",
                      }}
                    >
                      <Play style={{ width: 12, height: 12 }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Volume */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", margin: 0 }}>Volume</p>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: 2, marginBottom: 0 }}>{volume}%</p>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => void changeVolume(parseInt(e.target.value, 10))}
            style={{ width: 144, accentColor: "var(--color-accent)" }}
          />
        </div>

        {/* Pitch */}
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", margin: 0 }}>Pitch</p>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: 2, marginBottom: 0 }}>
              {PITCH_LABELS[pitch as PitchOctave]}
            </p>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {([-1, 0, 1] as PitchOctave[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => void changePitch(p)}
                style={{
                  padding: "6px 12px", fontSize: "var(--font-size-xs)", fontWeight: 500,
                  borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
                  background: pitch === p ? "var(--color-accent)" : "var(--color-bg)",
                  color: pitch === p ? "#fff" : "var(--color-text-muted)",
                  transition: "background 150ms ease, color 150ms ease",
                }}
              >
                {PITCH_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
