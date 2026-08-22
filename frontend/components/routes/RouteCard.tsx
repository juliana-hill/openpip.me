"use client";

import { Briefcase, Calendar, Clock, ExternalLink, MapPin } from "lucide-react";
import { useState } from "react";
import { modeIcons, type RouteOption, type RouteLeg } from "@/types/routes";
import styles from "./RouteCard.module.css";

type RouteCardProps = Readonly<{
  option: RouteOption;
  travelDate?: string; // YYYY-MM-DD
}>;

function formatTravelDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dateOnly = new Date(y, m - 1, d);

  const formatted = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (dateOnly.getTime() === today.getTime()) return `Today, ${formatted.replace(/^\w+,\s*/, "")}`;
  if (dateOnly.getTime() === tomorrow.getTime()) return `Tomorrow, ${formatted.replace(/^\w+,\s*/, "")}`;
  return formatted;
}

function parseCost(cost: string): number | null {
  const m = cost.match(/\$([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, "")) : null;
}

function computeDisplayPrice(option: RouteOption): string {
  if (option.totalPrice !== "N/A") return option.totalPrice;
  let sum = 0;
  let hasAny = false;
  for (const leg of option.legs) {
    const cost = parseCost(leg.cost);
    if (cost !== null) {
      sum += cost;
      hasAny = true;
    }
  }
  return hasAny ? `~$${sum.toLocaleString()}` : "N/A";
}

function computeDisplayDuration(option: RouteOption): string {
  if (option.totalDuration !== "N/A") return option.totalDuration;
  const totalMins = option.legs.reduce((s, l) => s + l.durationMinutes, 0);
  if (totalMins <= 0) return "N/A";
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const dur = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
  return `~${dur}`;
}

function LegContent({ leg }: { leg: RouteLeg }) {
  if (leg.isLayover) {
    return (
      <>
        <div className={styles.legHeader}>
          <p className={styles.legLabelLayover}>
            {leg.isOvernightLayover ? "Overnight layover" : "Transfer"}
            {leg.layoverLocation ? ` at ${leg.layoverLocation}` : ""}
          </p>
          <p className={styles.legDurationLayover}>{leg.duration}</p>
        </div>
      </>
    );
  }

  const hasTimes = leg.departureTime || leg.arrivalTime;
  const hasStops = leg.from || leg.to;
  const showCost = leg.cost && leg.cost !== "$0";

  return (
    <>
      <div className={styles.legHeader}>
        <p className={styles.legLabel}>{leg.label}</p>
        <p className={styles.legDuration}>
          {leg.duration}{showCost ? ` · ${leg.cost}` : ""}
        </p>
      </div>

      {hasTimes && (
        <p className={styles.legTimes}>
          {leg.departureTime && leg.arrivalTime
            ? `${leg.departureTime} → ${leg.arrivalTime}`
            : leg.departureTime ?? leg.arrivalTime}
        </p>
      )}

      {hasStops && !hasTimes && (
        <p className={styles.legStops}>
          <MapPin style={{ display: "inline", width: 12, height: 12, marginRight: 2, verticalAlign: "-1px" }} />
          {leg.from && leg.to ? `${leg.from} → ${leg.to}` : leg.from ?? leg.to}
        </p>
      )}

      {(leg.headsign || leg.stopCount || leg.distanceLabel) && (
        <p className={styles.legMeta}>
          {[
            leg.headsign ? `toward ${leg.headsign}` : null,
            leg.stopCount ? `${leg.stopCount} stop${leg.stopCount !== 1 ? "s" : ""}` : null,
            leg.distanceLabel ?? null,
          ].filter(Boolean).join(" · ")}
        </p>
      )}

      {leg.links && leg.links.length > 0 && (
        <div className={styles.legLinks}>
          {leg.links.map((link, j) => (
            <a key={j} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.legLink}>
              <ExternalLink style={{ width: 12, height: 12, flexShrink: 0 }} />
              {link.title}
            </a>
          ))}
        </div>
      )}

      {(leg.agencyUri || leg.lineUri) && (
        <div className={styles.legAgencyLinks}>
          {leg.lineUri && (
            <a href={leg.lineUri} target="_blank" rel="noopener noreferrer" className={styles.legAgencyLink}>
              <ExternalLink style={{ width: 10, height: 10, flexShrink: 0 }} />
              Route info
            </a>
          )}
          {leg.agencyUri && (
            <a href={leg.agencyUri} target="_blank" rel="noopener noreferrer" className={styles.legAgencyLink}>
              <ExternalLink style={{ width: 10, height: 10, flexShrink: 0 }} />
              Agency website
            </a>
          )}
        </div>
      )}
    </>
  );
}

export function RouteCard({ option, travelDate }: RouteCardProps) {
  const [collapsed, setCollapsed] = useState(true);
  const totalMinutes = option.legs.reduce((sum, l) => sum + l.durationMinutes, 0);
  const displayPrice = computeDisplayPrice(option);
  const displayDuration = computeDisplayDuration(option);
  const priceParenIdx = displayPrice.indexOf(" (");
  const priceTotal = priceParenIdx !== -1 ? displayPrice.slice(0, priceParenIdx) : displayPrice;
  const priceBreakdown = priceParenIdx !== -1 ? displayPrice.slice(priceParenIdx) : null;

  const routeDate = option.travelDate;
  const showDateBadge = routeDate && routeDate !== travelDate;

  return (
    <div className={styles.card}>
      <div className={styles.cardBody}>
        {/* Header */}
        <div className={styles.header} onClick={() => setCollapsed(c => !c)}>
          <div className={styles.nameGroup}>
            <div className={styles.modeIcons}>
              {option.modes.map((mode, i) => {
                const Icon = modeIcons[mode];
                return (
                  <div key={`${mode}-${i}`} className={styles.modeIcon}>
                    <Icon style={{ width: 20, height: 20 }} />
                  </div>
                );
              })}
            </div>
            <div>
              <h3 className={styles.routeName}>{option.name}</h3>
              <p className={styles.routeSubtitle}>{option.subtitle}</p>
            </div>
          </div>
          <div className={styles.stats}>
            {showDateBadge && (
              <div className={styles.dateBadge}>
                <p className={styles.dateBadgeLabel}>Date</p>
                <p className={styles.dateBadgeValue}>{formatTravelDate(routeDate!)}</p>
              </div>
            )}
            <div className={styles.stat}>
              <p className={styles.statLabel}>Duration</p>
              <p className={styles.statValue}>{displayDuration}</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statLabel}>Price</p>
              <p className={styles.priceValue}>{priceTotal}</p>
              {priceBreakdown && <p className={styles.priceBreakdown}>{priceBreakdown}</p>}
            </div>
          </div>
        </div>

        {/* Collapsible content */}
        <div className={`${styles.collapseGrid} ${collapsed ? styles.closed : styles.open}`}>
          <div className={styles.collapseInner}>
            <div className={styles.collapseContent}>
              {/* Timeline bar */}
              <div className={styles.barRow}>
                <div className={styles.bar}>
                  {option.legs.map((leg, i) => {
                    const pct = totalMinutes > 0 ? (leg.durationMinutes / totalMinutes) * 100 : 0;
                    const isTransit = leg.mode === "train" || leg.mode === "bus" || leg.mode === "local_bus";
                    return (
                      <div
                        key={i}
                        className={isTransit ? styles.barSegmentTransit : styles.barSegmentPrimary}
                        style={{ width: `${pct}%` }}
                      />
                    );
                  })}
                </div>
                <div className={`${styles.workBadge} ${option.workableHours > 0 ? styles.workBadgePositive : styles.workBadgeNeutral}`}>
                  <Briefcase style={{ display: "inline", width: 12, height: 12, marginRight: 4, verticalAlign: "-1px" }} />
                  Work: {option.workableHours}h
                </div>
              </div>

              {/* Calendar note */}
              {option.calendarNote && (
                <div className={styles.calendarNote}>
                  <Calendar style={{ width: 14, height: 14, marginTop: 2, flexShrink: 0 }} />
                  <span>{option.calendarNote}</span>
                </div>
              )}

              {/* Leg steps */}
              <div className={styles.legs}>
                {option.legs.map((leg, i) => {
                  const isLast = i === option.legs.length - 1;
                  return (
                    <div key={i} className={styles.legRow}>
                      <div className={styles.legIconCol}>
                        <div className={`${styles.legIcon} ${leg.isLayover ? styles.legIconLayover : styles.legIconDefault}`}>
                          {leg.isLayover
                            ? <Clock style={{ width: 16, height: 16 }} />
                            : (() => { const Icon = modeIcons[leg.mode]; return <Icon style={{ width: 16, height: 16 }} />; })()
                          }
                        </div>
                        {!isLast && (
                          <div className={`${styles.legConnector} ${leg.isLayover ? styles.legConnectorLayover : styles.legConnectorDefault}`} />
                        )}
                      </div>

                      <div className={`${styles.legContent} ${isLast ? styles.legContentLast : ""} ${leg.isLayover ? styles.legContentLayover : styles.legContentDefault}`}>
                        <LegContent leg={leg} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
