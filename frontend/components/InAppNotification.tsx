"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { idbListNotifications, idbDismissNotification, idbGetUserPrefs, type AppNotification } from "@/lib/idb";
import { playSound, normalizeSound, type SoundName, type PitchOctave } from "@/lib/sounds";
import styles from "./InAppNotification.module.css";


/**
 * Renders persistent in-app notifications in the top-right corner.
 *
 * Notifications are written to IDB by the service worker when a background
 * job completes. This component reads them on mount and listens for new
 * ones via BroadcastChannel. Notifications persist across page navigation
 * and refresh until the user explicitly dismisses them.
 *
 * Mounted in the root layout so it works on every page.
 */
export function InAppNotification() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const soundRef   = useRef<SoundName>("chime");
  const volumeRef  = useRef(0.8);
  const pitchRef   = useRef<PitchOctave>(0);

  useEffect(() => {
    idbGetUserPrefs().then((prefs) => {
      soundRef.current  = normalizeSound(prefs.notificationSound ?? null);
      volumeRef.current = prefs.notificationVolume ? parseInt(prefs.notificationVolume, 10) / 100 : 0.8;
      pitchRef.current  = prefs.notificationPitch  ? (parseInt(prefs.notificationPitch, 10) as PitchOctave) : 0;
    }).catch(() => {});
  }, []);

  const dismiss = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await idbDismissNotification(id);
  }, []);

  // Load persisted notifications from IDB on mount
  useEffect(() => {
    idbListNotifications().then((list) => {
      if (list.length > 0) setNotifications(list);
    }).catch(() => {});
  }, []);

  const maybeChime = useCallback(() => {
    playSound(soundRef.current, { volume: volumeRef.current, pitch: pitchRef.current });
  }, []);

  // Listen for task/meeting reminder notifications dispatched from TasksDashboard
  useEffect(() => {
    const handler = (e: Event) => {
      const notification = (e as CustomEvent<AppNotification>).detail;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        maybeChime();
        return [...prev, notification];
      });
    };
    window.addEventListener("task-reminder", handler);
    return () => window.removeEventListener("task-reminder", handler);
  }, [maybeChime]);

  // Listen for new notifications via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel("route-jobs");

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data?.notifyInApp) return;

      const id = `${data.type}-${data.jobId}-${Date.now()}`;
      let href: string | undefined;
      if (data.type === "CHAT_UPDATE") href = "/planning";
      if (data.type === "JOB_UPDATE") href = "/trips";

      const notification: AppNotification = {
        id,
        title: data.notifyTitle ?? "Task complete",
        body: data.notifyBody ?? "",
        href,
        ts: Date.now(),
      };

      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        maybeChime();
        return [...prev, notification];
      });
    };

    return () => channel.close();
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className={styles.container}>
      {notifications.map((n) => (
        <div key={n.id} role="alert" className={styles.toast}>
          <div className={styles.body}>
            <p className={styles.title}>{n.title}</p>
            {n.body && <p className={styles.message}>{n.body}</p>}
            {n.href && <a href={n.href} className={styles.link}>View →</a>}
          </div>
          <button onClick={() => dismiss(n.id)} className={styles.dismiss} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
