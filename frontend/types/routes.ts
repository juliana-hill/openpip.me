import type { LucideIcon } from "lucide-react";
import { Car, Plane, Train, Bus, Smartphone, BusFront } from "lucide-react";

export type TransportMode = "car" | "flight" | "train" | "bus" | "rideshare" | "local_bus";

export type RouteLeg = {
  mode: TransportMode;
  label: string;
  duration: string;
  durationMinutes: number;
  cost: string;
  links?: { title: string; url: string }[];
  // Enriched itinerary detail
  departureTime?: string;
  arrivalTime?: string;
  from?: string;
  to?: string;
  headsign?: string;
  agencyUri?: string;
  lineUri?: string;
  distanceLabel?: string;
  stopCount?: number;
  isLayover?: boolean;
  layoverLocation?: string;
  isOvernightLayover?: boolean;
};

export type RouteOption = {
  name: string;
  subtitle: string;
  modes: TransportMode[];
  totalDuration: string;
  totalPrice: string;
  workableHours: number;
  legs: RouteLeg[];
  calendarNote?: string;
  travelDate?: string; // YYYY-MM-DD actual departure date
  departureIso?: string; // ISO departure time (transit only) — used for sort
};

export const modeIcons: Record<TransportMode, LucideIcon> = {
  car: Car,
  flight: Plane,
  train: Train,
  bus: Bus,
  rideshare: Smartphone,
  local_bus: BusFront,
};

export const modeLabels: Record<TransportMode, string> = {
  car: "Drive",
  flight: "Flight",
  train: "Train",
  bus: "Bus",
  rideshare: "Rideshare",
  local_bus: "Local Bus",
};
