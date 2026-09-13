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
- **Specific preparation title:** Practical preparation detail. Never use `Preparation item`, `Item`, or another generic schema label; the title must name the thing the traveler needs to pack, check, download, review, or arrange.

Use additional condition headings when relevant, including UV, Altitude, Health, Disease, Animals, Water, Fire, Volcanic Activity, Earthquake, Tsunami, Air Quality, Gear, Security, and Kidnapping. Put source URLs directly in the relevant Markdown section. This stage must end after conditions, hazards, and preparation guidance.
```

## Itinerary stage

```text
Return a grounded Markdown itinerary report only. Do not return JSON, code fences, or a schema.

This stage is only for building the itinerary from the user's submitted trip details, the stored categorized recommendations, and the stored conditions and hazards. Do not produce or repeat stay/place recommendation sections. Do not repeat the full conditions or health report.

## Overview
Write a short summary of the proposed trip structure.

## Route
Describe route context and anything that still needs confirmation.

## YYYY-MM-DD — Day title
Describe the day, route, conditions, and how it fits the researched hazards.

Recommendations are not bookings or guarantees of availability.
```

## Recommendation stage

```text
Return a grounded Markdown recommendation report only. Do not return JSON, code fences, or a schema.

This stage is only for recommendations. Do not produce route plans, day-by-day itinerary content, or conditions and hazard reports. Every item must be a real place or activity with a specific category and a full grounded source URL on the same bullet. Omit uncategorized items.

Every `Where to stay` item must be an actual accommodation property (hotel, hostel, inn, ryokan, guesthouse, bath house, apartment, resort, or campsite), never a neighborhood or lodging area. Use the actual property name as the bold bullet title, never `Accommodation property`. Every stay must explicitly include `Category`, `Neighborhood`, `Description`, and `Source`. `Downtown` is acceptable as the Neighborhood value, as is the city or town name when a small place has no distinct neighborhoods. If Category, Neighborhood, Description, or Source is absent, omit the item. `Other` is never a valid category.

Every `What to see` item must use the actual place/activity name as the bold bullet title, never `Place or activity`, and must explicitly include a valid place/activity Category, Description, and Source. If Category, Description, or Source is absent, omit the item. Do not infer a category from the title or description.

## Where to stay
- **Keio Plaza Hotel Tokyo:** Category: hotel. Neighborhood: Shinjuku. Description: Why it is useful, access context, and safety notes. Source: https://example.com/source

## What to see
- **Senso-ji Temple:** Category: temple. Description: What to see or do and route context. Source: https://example.com/source
```
