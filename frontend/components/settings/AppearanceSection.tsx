"use client";
import { useState, useEffect } from "react";
import { applyTheme, loadSavedTheme, type AccentColor, type ThemeMode } from "@/lib/theme";
import { pushUserData } from "@/lib/sync";
import styles from "./AppearanceSection.module.css";

const ACCENTS: { key: AccentColor; color: string; label: string }[] = [
  { key: "red",   color: "#e5383b", label: "Openclaw Red" },
  { key: "coral", color: "#f47560", label: "Coral"        },
  { key: "green", color: "#6b9e6b", label: "Matcha"       },
  { key: "blue",  color: "#1877f2", label: "Blue"         },
  { key: "lilac", color: "#9b72cf", label: "Lilac"        },
];

export function AppearanceSection() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [accent, setAccent] = useState<AccentColor>("coral");

  useEffect(() => {
    const saved = loadSavedTheme();
    setMode(saved.mode);
    setAccent(saved.accent);
  }, []);

  function handleMode(m: ThemeMode) {
    setMode(m);
    applyTheme(m, accent);
    void pushUserData();
  }
  function handleAccent(a: AccentColor) {
    setAccent(a);
    applyTheme(mode, a);
    void pushUserData();
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Appearance</h2>

      <div className={styles.field}>
        <label className={styles.label}>Theme</label>
        <div className={styles.segmented}>
          {(["light","dark","system"] as ThemeMode[]).map((m) => (
            <button key={m} className={`${styles.seg} ${mode === m ? styles.segActive : ""}`} onClick={() => handleMode(m)}>
              {m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Accent Color</label>
        <div className={styles.swatches}>
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              className={`${styles.swatch} ${accent === a.key ? styles.swatchActive : ""}`}
              style={{ "--swatch-color": a.color } as React.CSSProperties}
              onClick={() => handleAccent(a.key)}
              aria-label={a.label}
              title={a.label}
            >
              {accent === a.key && <span className={styles.check}>✓</span>}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
