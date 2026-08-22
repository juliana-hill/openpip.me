"use client";

import { proxyFetch } from "@/lib/proxy";
import { useEffect, useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, RefreshCw } from "lucide-react";
import { CalendarList, type CalendarInfo } from "./CalendarList";

type Props = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

type State = "idle" | "loading" | "populated" | "error";

const DAY_OPTIONS = [7, 14, 30] as const;

export function CalendarSheet({ open, onOpenChange }: Props) {
  const [state, setState] = useState<State>("idle");
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [error, setError] = useState("");
  const [days, setDays] = useState<number>(7);

  const fetchCalendars = useCallback(async (numDays: number) => {
    setState("loading");
    setError("");
    try {
      const res = await proxyFetch(`/agent/calendars?days=${numDays}`);
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
    if (open && state === "idle") {
      fetchCalendars(days);
    }
  }, [open, state, days, fetchCalendars]);

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
    fetchCalendars(newDays);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>

      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <SheetTitle>My Calendars</SheetTitle>
          </div>
          <SheetDescription>
            Upcoming events from your calendars
          </SheetDescription>
        </SheetHeader>

        <div className="flex gap-1 px-1 pb-3">
          {DAY_OPTIONS.map((d) => (
            <Button
              key={d}
              variant={days === d ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => handleDaysChange(d)}
            >
              {d} days
            </Button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          {state === "loading" && <CalendarSkeleton />}
          {state === "populated" && <CalendarList calendars={calendars} />}
          {state === "error" && (
            <div className="px-4 space-y-3 text-center">
              <p className="text-sm text-destructive">
                Could not load calendars. Check your Google connection.
              </p>
              {error && (
                <p className="text-xs text-muted-foreground">{error}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCalendars(days)}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4 px-3">
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
