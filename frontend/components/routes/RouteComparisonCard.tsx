"use client";

import { RouteCard } from "./RouteCard";
import type { RouteOption } from "@/types/routes";
import styles from "./RouteComparisonCard.module.css";

type CompareRoutesResult = {
  routes: RouteOption[];
};

type Props = {
  result: CompareRoutesResult;
};

function parseDurationMinutes(dur: string): number {
  const h = dur.match(/(\d+)h/);
  const m = dur.match(/(\d+)m/);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
}

export function RouteComparisonCard({ result }: Props) {
  if (!result?.routes?.length) {
    return <p className={styles.empty}>No routes found.</p>;
  }

  const sorted = [...result.routes].sort((a, b) => {
    const aMs = a.departureIso ? new Date(a.departureIso).getTime() : Infinity;
    const bMs = b.departureIso ? new Date(b.departureIso).getTime() : Infinity;
    if (aMs !== bMs) return aMs - bMs;
    return parseDurationMinutes(a.totalDuration) - parseDurationMinutes(b.totalDuration);
  });

  return (
    <div className={styles.cards}>
      {sorted.map((route, i) => (
        <RouteCard key={i} option={route} />
      ))}
    </div>
  );
}
