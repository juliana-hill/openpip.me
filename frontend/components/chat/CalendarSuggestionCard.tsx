import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle, DollarSign, CheckCircle } from "lucide-react";
type CalendarSuggestion = {
  title: string;
  dateRange: string;
  duration: string;
  costNote: string;
  conflicts?: string;
};

type Props = { suggestion: CalendarSuggestion };

export function CalendarSuggestionCard({ suggestion }: Props) {
  const isFree = suggestion.costNote.toLowerCase().includes("free");

  return (
    <Card style={{ border: "1px solid var(--color-border)" }}>
      <CardContent>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <Calendar style={{ width: 16, height: 16, color: "var(--color-accent)", marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--color-text)" }}>{suggestion.title}</span>
        </div>

        {/* Date range + duration */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <Badge variant="muted">{suggestion.dateRange}</Badge>
          <Badge variant="muted">{suggestion.duration}</Badge>
        </div>

        {/* Cost note */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8 }}>
          {isFree ? (
            <CheckCircle style={{ width: 14, height: 14, color: "#4e7a4e", marginTop: 2, flexShrink: 0 }} />
          ) : (
            <DollarSign style={{ width: 14, height: 14, color: "#9a6000", marginTop: 2, flexShrink: 0 }} />
          )}
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>{suggestion.costNote}</span>
        </div>

        {/* Conflicts */}
        {suggestion.conflicts && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8 }}>
            <AlertTriangle style={{ width: 14, height: 14, color: "#9a6000", marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: "var(--font-size-xs)", color: "#9a6000" }}>{suggestion.conflicts}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
