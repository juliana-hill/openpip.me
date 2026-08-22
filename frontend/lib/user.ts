"use client";
import { useState, useEffect } from "react";
import { proxyFetch } from "./proxy";

export interface User {
  email: string;
  name: string;
  picture: string;
}

const PICTURE_CACHE_KEY = "user-picture-cache";

async function fetchAndCachePicture(url: string): Promise<string> {
  const cached = sessionStorage.getItem(PICTURE_CACHE_KEY);
  if (cached) {
    try {
      const { src, dataUrl } = JSON.parse(cached) as { src: string; dataUrl: string };
      if (src === url) return dataUrl;
    } catch { /* invalid cache */ }
  }
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    sessionStorage.setItem(PICTURE_CACHE_KEY, JSON.stringify({ src: url, dataUrl }));
    return dataUrl;
  } catch {
    return url;
  }
}

export function useUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    proxyFetch("/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then(async (data: User | null) => {
        if (data?.picture) {
          data.picture = await fetchAndCachePicture(data.picture);
        }
        setUser(data);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
