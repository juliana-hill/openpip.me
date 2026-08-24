"use client";

import { proxyFetch } from "@/lib/proxy";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, RefreshCw, X } from "lucide-react";
import { CalendarList, type CalendarInfo } from "./CalendarList";

const DAY_OPTIONS = [7, 14, 30] as const;

type Props = {
  closeHref: string;
};

export function CalendarPanel({ closeHref }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "populated" | "error">("loading");
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [error, setError] = useState("");
  const [days, setDays] = useState<number>(7);

  const fetchCalendars = useCallback(async (numDays: number) => {
    setState("loading");
    setError("");
    try {
      // Anchor to the browser's local date — the backend defaults to the
      // server's UTC date when `from` is omitted, which drifts a day off
      // near midnight for anyone not on UTC.
      const from = new Date().toLocaleDateString("en-CA");
      const res = await proxyFetch(`/agent/calendars?days=${numDays}&from=${from}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { calendars: CalendarInfo[] };
      setCalendars(data.calendars);
      setState("populated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setState("error");
    }
  }, []);

  useEffect(() => {
    fetchCalendars(days);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full border-l border-border/10 bg-card/80 backdrop-blur-sm w-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Calendar</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => router.push(closeHref)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-3 pt-3 pb-2 flex gap-1.5">
        {DAY_OPTIONS.map((d) => (
          <Button
            key={d}
            variant={days === d ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => {
              setDays(d);
              fetchCalendars(d);
            }}
          >
            {d}d
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 ml-auto"
          onClick={() => fetchCalendars(days)}
        >
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {state === "loading" && <CalendarPanelSkeleton />}
        {state === "populated" && <CalendarList calendars={calendars} />}
        {state === "error" && (
          <div className="space-y-3 text-center py-8 px-4">
            <p className="text-sm text-destructive">Could not load calendars.</p>
            {error && <p className="text-xs text-muted-foreground">{error}</p>}
            <Button variant="outline" size="sm" onClick={() => fetchCalendars(days)}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarPanelSkeleton() {
  return (
    <div className="space-y-4 px-3 pt-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 w-2.5 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="pl-5 space-y-1.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}
