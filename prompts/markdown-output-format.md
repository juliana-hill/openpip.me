# Markdown research response format

## Conditions, health, and gap-review stages

```text
Return a grounded Markdown research report only. Do not return JSON, code fences, or a schema.

This stage is only for current conditions, health, hazards, safety, and preparation. Do not produce places to stay, places to see, route plans, or a day-by-day itinerary here.

## Overview
Write a short trip-specific summary.

## Weather
Describe the current weather or seasonal condition and what it means for this trip.

## Temperature
Describe temperature-related exposure or illness risk when relevant.

## Preparation
- **Preparation title:** Practical preparation detail.

Use additional condition headings when relevant, including UV, Altitude, Health, Disease, Animals, Water, Fire, Volcanic Activity, Earthquake, Tsunami, Air Quality, Gear, Security, and Kidnapping. Put source URLs directly in the relevant Markdown section. This stage must end after conditions, hazards, and preparation guidance.
```

## Itinerary stage

```text
Return a grounded Markdown itinerary report only. Do not return JSON, code fences, or a schema.

This stage is only for the trip structure and recommendations. Do not repeat the full conditions or health report; shape the itinerary around the researched constraints. Every stay and place recommendation must include its full grounded source URL on the same bullet, using `Source: https://...`; do not put those URLs only in a separate sources section or rely only on citation markers.

## Overview
Write a short summary of the proposed trip structure.

## Where to stay
- **Stay or lodging area:** Why it is a useful base, access context, and safety notes. Source: https://example.com/source

## What to see
- **Place or activity:** What to see or do and route context. Source: https://example.com/source

## Route
Describe route context and anything that still needs confirmation.

## YYYY-MM-DD — Day title
Describe the day, route, conditions, and how it fits the researched hazards.

Recommendations are not bookings or guarantees of availability.
```
