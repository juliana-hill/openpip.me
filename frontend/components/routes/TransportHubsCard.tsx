"use client";

import { Plane, Train, Bus, MapPin } from "lucide-react";
import styles from "./TransportHubsCard.module.css";

type TransportHub = {
  name: string;
  type: "airport" | "train_station" | "bus_station" | "bus_stop";
  code?: string;
  city: string;
};

type FindHubsResult = {
  airports: TransportHub[];
  trainStations: TransportHub[];
  busStations: TransportHub[];
  busStops: TransportHub[];
};

const hubSections = [
  { key: "airports" as const, label: "Airports", Icon: Plane },
  { key: "trainStations" as const, label: "Train Stations", Icon: Train },
  { key: "busStations" as const, label: "Bus Stations", Icon: Bus },
  { key: "busStops" as const, label: "Bus Stops", Icon: MapPin },
];

type Props = { result: string; location: string };

export function TransportHubsCard({ result, location }: Props) {
  let hubs: FindHubsResult | null = null;
  try {
    if (typeof result === "string") hubs = JSON.parse(result);
    else hubs = result as FindHubsResult;
  } catch { /* parse failed */ }

  if (!hubs) return <p className={styles.empty}>No transport hubs found.</p>;

  const totalHubs =
    hubs.airports.length + hubs.trainStations.length + hubs.busStations.length + (hubs.busStops?.length ?? 0);
  if (totalHubs === 0) return <p className={styles.empty}>No transport hubs found near {location}.</p>;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <p className={styles.title}>Transport Hubs</p>
        <p className={styles.subtitle}>Near {location}</p>
      </div>
      <div className={styles.body}>
        {hubSections.map(({ key, label, Icon }) => {
          const items = hubs![key] ?? [];
          if (items.length === 0) return null;
          return (
            <div key={key} className={styles.section}>
              <div className={styles.sectionHeader}>
                <Icon size={14} className={styles.sectionIcon} />
                <span className={styles.sectionLabel}>{label}</span>
              </div>
              <div className={styles.grid}>
                {items.map((hub, i) => (
                  <div key={i} className={styles.hub}>
                    <p className={styles.hubName}>
                      {hub.name}
                      {hub.code && <span className={styles.hubCode}>{hub.code}</span>}
                    </p>
                    <p className={styles.hubCity}>{hub.city}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
