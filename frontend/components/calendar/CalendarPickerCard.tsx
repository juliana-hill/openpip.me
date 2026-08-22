"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export type CalendarEntry = {
  id: string;
  name: string;
  color: string;
  primary: boolean;
  accessRole: string;
};

type Props = {
  calendars: CalendarEntry[];
  onSubmit: (selected: CalendarEntry[]) => void;
};

export function CalendarPickerCard({ calendars, onSubmit }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const defaults = new Set<string>();
    for (const cal of calendars) {
      if (cal.primary || cal.accessRole === "owner" || cal.accessRole === "writer") {
        defaults.add(cal.id);
      }
    }
    return defaults;
  });

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    const selected = calendars.filter((c) => selectedIds.has(c.id));
    onSubmit(selected);
  }

  const count = selectedIds.size;

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-4" />
          Which calendars should I check?
        </CardTitle>
        <CardDescription>
          Select the calendars to include in this conversation.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {calendars.map((cal) => (
          <label
            key={cal.id}
            className="flex items-center gap-3 cursor-pointer"
          >
            <Checkbox
              checked={selectedIds.has(cal.id)}
              onCheckedChange={() => toggle(cal.id)}
            />
            <span
              className="size-3 rounded-full shrink-0"
              style={{ backgroundColor: cal.color }}
            />
            <span className="text-sm">
              {cal.name}
              {cal.primary && (
                <span className="ml-1.5 text-xs text-muted-foreground">(primary)</span>
              )}
            </span>
          </label>
        ))}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={count === 0} className="w-full">
          {count === 0
            ? "Select at least one calendar"
            : `Use ${count} calendar${count === 1 ? "" : "s"}`}
        </Button>
      </CardFooter>
    </Card>
  );
}
