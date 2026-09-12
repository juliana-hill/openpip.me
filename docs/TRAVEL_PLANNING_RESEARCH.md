# Travel Planning Research

**Branch:** `codex/travel-planning`
**Research date:** 2026-09-11
**Product boundary:** itinerary planning and preparation only. OpenPip does not book transport or lodging, process payments, or store payment-card data.

## Executive recommendation

Build a trip workspace that turns a destination, date range, activities, and route into:

1. a day-by-day itinerary;
2. route geometry, distance, duration, elevation, and waypoints;
3. a source-linked safety brief for weather, active hazards, security, health, UV, altitude, animals, air quality, fire, and water availability;
4. a condition-aware gear and preparation checklist; and
5. outbound links for the user to verify or book elsewhere.

The first release should show source-specific risk signals with timestamps and confidence, not one opaque “trip safety score.” A route can be reasonable overall while one day, trail, border crossing, or water source is not.

## Updated architecture choice: Nova Web Grounding

Use Amazon Nova 2 Lite with the `nova_grounding` system tool as the primary research layer for current public travel facts. OpenPip already has a direct Bedrock grounding pattern in `backend/src/openpip_backend/agent.py`; the travel feature should extend that pattern and preserve the returned citations rather than inventing a second web-research pipeline.

This means:

- Nova Grounding researches current public facts and returns source URLs/citations for the itinerary brief.
- Google APIs read private Gmail and Calendar data directly, with the existing metadata-first helpers. Private messages and events are not sent to public web search.
- A routing provider supplies machine-readable geometry and distances. Nova can explain route tradeoffs, but it is not the source of coordinates, elevation, closures, or turn-by-turn directions.
- Deterministic code owns thresholds, freshness windows, source precedence, and hard stops. Nova summarizes, prioritizes, and explains the evidence.
- Do not add Playwright, browser automation, a headless browsing pipeline, or a general-purpose crawler.

Nova Web Grounding requires the supported AWS region/inference-profile setup, the `bedrock:InvokeTool` permission, and citation display in the product. It also has additional model/tool cost and may take materially longer than a normal model call, so the UI should show a research/loading state and allow stale-source refresh rather than appearing frozen.

### Travel planning must be a Strands agentic run

The travel planner must be implemented as a Strands `Agent` run backed by Nova, not as a fixed sequence of direct Bedrock API calls disguised as a pipeline. The pipeline wrapper may own durable run state, polling, persistence, and recovery, but the Strands agent must own the research loop:

- inspect the current trip context and the output already assembled;
- use Nova Grounding for current conditions, source-linked places to stay, and source-linked things to see;
- identify missing or weakly supported categories and decide what research/tool call is needed next;
- continue researching and revising the structured trip output until the required itinerary, preparation, safety, and recommendation fields are complete; and
- stop only after validation confirms the output is complete and every stay/place recommendation is backed by a returned grounding citation.

The agent must be able to recover from malformed model JSON: first parse the returned object with the host-language JSON parser, then call a separate ungrounded Nova JSON-repair function only when parsing fails. The repair call must preserve the original data and must not add grounding citations; citations from the original grounded turn remain attached to the research result. A failed tool call, incomplete response, or validation gap should return control to the Strands agent for another attempt with backoff, while the durable run remains pollable. Do not model this as an unconditional chain of three research calls or as a deterministic fallback that fabricates missing travel facts.

The supervisor delegates gaps to fresh specialist sub-agents. Each delegated step constructs a new Strands `Agent` with its own system prompt (conditions, health, safety, route, lodging, places, preparation, or gap filling) and receives the complete **Start from scratch** form as explicit input: destination, start date, end date, selected activities (City, Hiking, Road trip, Camping, Cycling, or Water activity), trip pace, and the note that passport/health context has not yet been provided. The supervisor calls gap analysis after merges, passes its missing sections and signal categories to the appropriate specialist, and only accepts a final candidate after the validator confirms it.

### Study Me is the prerequisite

Do not create a second pipeline that re-reads the user’s whole life. The existing Study Me pipeline owns collection and writes its metadata-only index under `OpenPip/memory/insights_gathering/manifest`. A downstream trip pass may start only when Study Me reports `completed`.

The downstream pass reads that index, extracts trip-shaped records, and writes its output separately under `OpenPip/travel/trips` with its own run metadata under `OpenPip/travel/trips/manifest`. This keeps the trip library independently refreshable and prevents partial Study Me output from being presented as a complete trip history. Scratch plans can be saved directly to the trip output directory without waiting for Study Me.

The same prerequisite applies to Inbox Assistant triage: a new inbox review may not be queued until Study Me reports `completed`, because triage depends on the indexed personal context. The server enforces this at the queue boundary and the Inbox Assistant card mirrors the Study Me waiting state. Existing saved triage history remains reviewable whenever history entries exist.

## What the research says

### Weather and exposure

- The U.S. National Weather Service API is open data, provides point forecasts, observations, and active alerts, and supports forecast lookup through `/points/{lat},{lon}` followed by the returned forecast URLs. It is a strong U.S. source but does not cover the world. Use it for U.S. stops and route corridors, with caching and a descriptive `User-Agent`.
- Open-Meteo provides global forecast fields useful to the planner, including temperature, precipitation probability, wind/gusts, visibility, snow, freezing level, evapotranspiration, and UV index. Its free API is for non-commercial use; commercial use requires a subscription. Treat it as an evaluation/prototype source unless the deployment has the appropriate license.
- Forecasts must be attached to a place and local date/time zone. Do not merge weather from multiple stops into a single trip-level claim. For dates beyond forecast range, show seasonal/climate context as a lower-confidence planning hint rather than a forecast.

### Health, disease, vaccination, and entry requirements

- CDC destination pages and the Yellow Book provide destination- and itinerary-dependent recommendations for routine vaccines, travel vaccines, malaria prevention, food/water safety, animal exposure, and other health risks.
- WHO publishes travel-vaccine guidance and country requirements, but explicitly warns that requirements can change and travelers should confirm with the destination’s embassy or consulate.
- IATA Travel Centre/Timatic is the most practical source for personalized passport, visa, and health-document checks for air travel because the result depends on passport nationality, document type/expiry, origin, transit points, and itinerary. Its public consumer portal and commercial Timatic products have different integration terms; do not scrape or silently reproduce it.
- Product language must distinguish:
  - **Entry requirement:** a document or vaccine rule reported by an authoritative border/air-travel source.
  - **Health recommendation:** advice from CDC/WHO or a clinician-facing source.
  - **User preparation:** a checklist item generated from the itinerary, activity, and conditions.

The app should ask for passport country and transit countries only when the user wants an entry-requirement check. Do not store a passport number, scan, or full medical history. A travel-clinic referral is appropriate for individualized vaccine or medication advice.

### Animals and disease exposure

CDC guidance supports concise, actionable prompts: avoid unfamiliar animals, take special care around dogs, bats, monkeys, rodents, snakes, and marine animals where relevant, and seek immediate care after a bite or scratch. Rabies prevention depends on the animal, location, activity, and access to post-exposure treatment.

For outdoor destinations, official park or land-manager alerts are more useful than a generic animal list. The NPS API exposes park alerts, including danger, closure, caution, and information notices. Recreation.gov’s RIDB provides federal recreation areas, facilities, activities, and permits, but it is not a universal global trail database and may contain missing or incomplete coordinates.

Avoid generating a species-level warning from an unverified web result. Prefer a destination source or a user-selected activity such as “backcountry hiking,” then show the source link and the behavior that reduces exposure.

### UV index

- EPA describes the UV Index on a 1–11+ scale and recommends protective behavior at moderate and higher values; WHO recommends sun protection at UVI 3 or above.
- UV exposure is affected by time of day, latitude, season, cloud cover, and elevation. The altitude layer therefore changes the gear recommendation even when the temperature looks mild.
- Use the daily maximum and the peak outdoor window for each stop. Generate actions such as shade timing, hat/sunglasses, protective clothing, and sunscreen; do not turn UVI into a medical diagnosis or promise a “safe exposure time.”

### Drought, water scarcity, and fire

- The U.S. Drought Monitor is updated weekly and ranges from D0 (abnormally dry) to D4 (exceptional drought). It is broad-scale context, not confirmation that an individual spring, campground tap, or trail water cache is operating.
- Drought.gov exposes web-ready/GIS data from USDM, NOAA, NASA, USDA, USGS, and other partners. USGS water APIs provide real-time and historical streamflow, groundwater, and monitoring-location data for the United States.
- For a U.S. outdoor route, combine drought severity with land-manager alerts, known water points, current streamflow where available, route distance between resupply points, and the source’s observation date. In D2–D4 conditions or when a water point is unknown, elevate “carry extra water / verify locally / treat all natural water” to a prominent preparation item.
- Global drought and water-access data are fragmented. Phase 1 should state “coverage varies by destination” and link to the local park, municipality, reservoir, or water authority rather than implying global completeness.
- Wildfire data can be a useful supplemental signal. NASA FIRMS provides near-real-time satellite fire detections, but detections are not legal closure boundaries. Pair them with official land-manager closures and air-quality data before changing a route.

### Altitude sickness preparation

CDC Yellow Book and the Wilderness Medical Society identify unacclimatized travelers sleeping at approximately 2,450 m / 8,000 ft or higher as at risk, with risk shaped by sleeping altitude and ascent rate. The planner should reason from sleeping elevation—not merely the highest scenic point.

Preparation prompts for a high-altitude itinerary:

- flag a direct jump from low elevation to a high sleeping elevation;
- above about 3,000 m / 9,800 ft, flag sleeping-altitude gains over roughly 500 m / 1,650 ft per day and suggest an acclimatization night for larger gains;
- suggest a slower first 24–48 hours, mild activity, and avoiding alcohol during initial acclimatization;
- surface the itinerary’s highest sleeping elevation, daily gain, highest point, descent options, and nearest emergency access;
- include “do not ascend while symptomatic” and “descend / seek urgent medical help if symptoms worsen” as safety guidance; and
- tell the user to consult a clinician before relying on acetazolamide or any other medication. The app must not prescribe, dose, or infer a diagnosis.

Altitude also increases cold, low-humidity, and UV exposure. A high-altitude warning should therefore feed the gear checklist: layers, sun protection, hydration/water treatment, navigation backup, and an emergency communication plan.

## Recommended first-release experience

### Inputs

- origin and destination(s), with map-confirmed coordinates;
- dates or a flexible date window;
- activity types: city, road trip, hiking/backcountry, camping, cycling, water activity, skiing/snow, or custom;
- transport preference and maximum travel time per day;
- optional trip-purpose context, including business travel, inferred from the user’s indexed work and travel signals when available;
- desired pace, accessibility needs, and “must see” / “avoid” constraints;
- optional passport country and transit countries for document checks; and
- optional health-context checkboxes for the current session only, such as pregnancy, children, or prior altitude illness. Do not require or persist a diagnosis.

The overview should offer two equally visible ways to start:

- **Review an upcoming trip:** inspect read-only Gmail and Calendar signals, show the evidence, and build a preparation plan after the user reviews the detected details.
- **Plan another trip:** start from scratch with a destination, dates, activities, and constraints. This path does not require an existing reservation and never books anything.

If no trip is detected, the empty state should still make the second path obvious: “Plan a trip from scratch.”

### Results

Each day should contain:

- location and local time zone;
- activities and travel blocks;
- route leg(s) with mode, distance, duration, elevation gain/loss, and geometry;
- forecast or climate-context label, including precipitation, heat/cold, wind, visibility, and UV;
- nearby official alerts, closures, security advisories, disease notices, and water/air-quality concerns;
- preparation items with a reason and source; and
- an explicit uncertainty/freshness label.

The top of the trip should show only the most important actions, for example: “Trail closure intersects Day 3,” “No reliable water source confirmed between these waypoints,” or “Day 1 sleeping elevation rises 1,200 m.” The user can expand the source cards for details.

### Displaying detected trips

A detected-trip card should show the destination, date range, local time zone, evidence label (for example, “Calendar + Gmail”), confidence (`confirmed`, `likely`, or `needs review`), links back to the source records, and a clear **Build preparation plan** action. The overview should keep **Plan another trip** prominent below or beside the detected-trip list.

The distinction must remain visible in the copy and data model: a detected trip is a read-only import of user-provided context; a scratch plan is a new itinerary request. Neither is a booking workflow.

### Task — infer business travel from indexed context

Once Study Me reports `completed`, have the travel-planning agent inspect the completed `insights_gathering` index for business-travel signals before building the preparation plan. Use index-only metadata and evidence such as conference or offsite labels, client or office locations, work-related calendar blocks, and travel confirmations associated with work events; do not re-fetch private message bodies or send them to Nova Grounding.

The task should classify the trip purpose as `business`, `leisure`, `mixed`, or `unknown`, retain the supporting source references and confidence, and pass the result into itinerary planning. For business trips, account for fixed meeting windows, workday availability, proximity to the relevant office or venue, reliable transit, connectivity, and appropriate work gear while still preparing the destination-specific health, hazard, weather, and route guidance. If the evidence is weak or conflicting, show it as a suggestion for user confirmation rather than silently labeling the trip.

### Read-only trip extraction from the completed index

Use the completed Study Me manifest as the source of trip candidates. The trip pass should search index-only fields such as `kind`, `date`, `label`, `summary`, `detail`, and source URL. It should not re-fetch Gmail bodies or Calendar events during extraction.

1. Wait for `Study Me = completed`; if it is queued, running, paused, failed, or not started, return a gated state instead of starting.
2. Match travel-shaped evidence such as itinerary, reservation, confirmation, flight, hotel, rail, car rental, lodging, check-in, airport, travel, and trip.
3. Group nearby records with matching destination clues into a candidate and retain the contributing source references.
4. Classify saved records as past, current, or upcoming from their dates. Keep ambiguous single-source records as `needs review`.
5. Persist the candidate in the separate trip output directory and show its evidence. The user can review or edit details before using it to build a preparation plan.

Only pass normalized destination, dates, activity, and route context to Nova Grounding. Do not send raw email bodies, names, confirmation numbers, passport details, or private links to the web-grounding tool.

### No-booking rule

The trip model and API must contain no payment, card, CVV, billing, merchant checkout, reservation, PNR, or booking-confirmation fields. Allowed actions are:

- save/edit/delete an itinerary;
- recalculate a route or safety brief;
- export or share the plan if later requested; and
- open an external provider or official source in a new tab.

Outbound provider links should be labeled as external. The app must not imply availability, hold inventory, confirm a reservation, or claim that a purchase occurred.

## Data-source strategy

Use Nova Grounding for current public research, retaining citations and retrieval metadata. Add direct provider adapters only where deterministic, machine-readable data is needed (calendar/email, weather fields, route geometry, alerts, coordinates, or measurements). Each adapter should map into a common normalized record before Nova summarizes the result.

| Layer | Phase 1 source | Coverage / cadence | Product use |
|---|---|---|---|
| Grounded research | Amazon Nova 2 Lite + `nova_grounding` | Current public web sources with returned citations; supported AWS regions/inference profiles | Research synthesis, source-linked explanations, and destination-specific preparation prompts |
| Weather | Open-Meteo for prototype; NWS for U.S. | Global forecast up to 16 days from Open-Meteo; NWS point forecasts and alerts in the U.S. | Daily conditions, weather windows, exposure prompts |
| UV | Weather provider UV field, with WHO/EPA guidance | Forecast value by location/date; guidance is stable but values are forecast data | Sun-protection timing and gear |
| Security | U.S. State Department travel advisories | Destination-level advisory, reviewed regularly and updated when conditions change | Source-linked security context; never a composite safety score |
| Health | CDC Travelers’ Health + Yellow Book; WHO | Destination and itinerary-dependent; requirements can change | Health notices, vaccine/medication questions, water/animal prompts |
| Entry documents | IATA Travel Centre/Timatic or official consulate links | Highly dynamic; depends on traveler and transit details | “Verify before departure” document checklist |
| Disease outbreaks | WHO Disease Outbreak News; CDC travel notices | Event-driven | Active-health-event notice with publication date |
| Outdoor alerts | NPS API; Recreation.gov RIDB; land-manager sources | Alerts/closures and recreation metadata; U.S.-focused | Trail/park alerts, facilities, permits, emergency context |
| Drought/water | USDM/Drought.gov + USGS water data | Weekly drought; daily/real-time water measurements where available | Water scarcity context, not a guarantee of water availability |
| Fire/AQI | Official land-manager closures + AirNow; NASA FIRMS as secondary | Near-real-time fire detections and air-quality products, U.S. strongest | Route review and smoke/fire preparation |
| Routing | OpenRouteService or Mapbox behind an adapter; MapLibre-compatible map UI | Provider-specific quotas/licensing | Geocoding, route geometry, alternatives, elevation/waypoints |

Source records should include `source_name`, `source_url`, `retrieved_at`, `published_at` when available, `valid_from`, `valid_until` when available, `geography`, `severity`, and `evidence_text`. Cache by normalized coordinates/date and re-fetch when the source is stale or the user explicitly refreshes.

## UI direction: native OpenPip surface

The former `~/Projects/Personal/travel-agent` application is historical reference material for the old look and behavior. It is not the source of truth for this feature: its route-search flow was tightly coupled to a Playwright-style pipeline, and that pipeline should not be carried forward.

The new `/trips` surface should follow the current OpenPip schema already used by the app:

- `RequireAuth` and the existing page shell;
- `AppHeader`, `PageShell`, and `FloatingAssistant` for the page frame;
- existing `Card`, `Badge`, `Button`, `Sheet`, `Dialog`, `EmptyState`, and skeleton primitives;
- CSS modules and the existing design tokens rather than a new visual system; and
- the existing source/collapsible-card visual language for citations, without coupling the travel domain to the old web-search result parser.

Create new travel-domain types beside the current route types instead of forcing an old route-search payload to represent a safety-aware itinerary. The minimum shapes are `TripCandidate`, `TripSummary`, `ItineraryDay`, `SafetySignal`, `PreparationItem`, and `SourceCitation`. Keep `RouteOption`/`RouteLeg` only if the selected routing adapter actually returns route alternatives and legs with those semantics.

Proposed page structure:

```text
RoutesPage
├─ TripsOverview
│  ├─ TripLibraryCard (past / current / upcoming)
│  └─ PlanAnotherTripCard
└─ TripWorkspace
   ├─ TripHeader (destination, dates, local timezone, freshness)
   ├─ ActionSummaryCard (highest-priority preparation actions)
   ├─ ItineraryTimeline
   │  ├─ ItineraryDayCard
   │  └─ RouteSummary / RouteMapPanel (text fallback first)
   ├─ SafetyBrief
   │  └─ SafetySignalCard (weather, UV, health, animals, altitude, water/fire, security)
   ├─ PreparationChecklist
   └─ SourceCitationList / expandable evidence cards

The dashboard should also contain a Study Me-adjacent trip-library card. While Study Me is queued or running, it must say: **“Waiting for [agent name] to finish studying you…”** and show that trip indexing is waiting. Once Study Me is complete, the card becomes the explicit **Build trip library** action. This downstream action must not be available while the prerequisite is incomplete.
```

The first viewport should make both entry points visible: the saved trip library grouped as past/current/upcoming and a clearly labeled scratch-plan action. Refreshing the library is a downstream action gated by Study Me completion. Important warnings belong near the relevant day or route leg, not in a single generic score. The UI should have explicit loading, no-trip, needs-review, stale-source, provider-unavailable, and partial-results states.

Use language such as “Detected from Calendar and Gmail,” “Likely trip — review details,” “Build preparation plan,” “Plan another trip,” and “Verify before departure.” Avoid “book,” “reservation confirmed,” or “safe” unless the product is only quoting evidence from a source and labels it accordingly.

## Routing and mapping decision

The current repository has preserved route cards and a route-search UI, but the new `/trips` workspace intentionally starts with text route summaries and no map provider dependency. The old frontend references `/agent/compare-routes` endpoints that are not implemented in the current FastAPI app, so interactive map geometry remains a later adapter-backed slice.

Recommended implementation boundary:

1. Geocode user-entered places to a candidate list and require confirmation when the match is ambiguous.
2. Make the first visible slice an external map link plus an accessible text route summary; do not make a map SDK a prerequisite for the itinerary workspace.
3. Add a server-side routing adapter once the provider is selected. It should return GeoJSON geometry, legs, duration, distance, elevation, and provider attribution.
4. Render geometry in a dedicated map component with accessible text summaries and a non-map fallback.
5. Intersect route corridors and itinerary stops with alerts, closures, fire/AQI, drought, and known water points only where the source supports spatial queries. Nova can explain these intersections, but must not invent coordinates or closures.
6. Keep the provider replaceable. OpenStreetMap data is open, but the public OSM tile and Nominatim servers have usage policies and best-effort availability; production should use an appropriate hosted provider or self-hosted infrastructure.

Mapbox is a fast path for directions and GeoJSON geometry, with driving, traffic-aware driving, walking, and cycling profiles. Its geocoding terms distinguish temporary from permanent results: temporary results cannot be cached for future use, so the plan should either use them only during an active session or use a licensed permanent-storage mode. OpenRouteService is a viable alternative with GeoJSON directions and an API key. Neither choice requires collecting a traveler’s payment card.

## Safety and language policy

- Show source, retrieval time, coverage, and uncertainty next to every consequential warning.
- Never say a destination is “safe,” “disease-free,” “fire-free,” or “open” based only on a stale or incomplete feed.
- Hard-stop itinerary generation for a confirmed closure or an impossible route; use a warning plus an alternative for elevated but non-blocking risk.
- Do not silently downgrade an official Level 3/4 travel advisory, active evacuation/closure, or severe route hazard into a generic tip.
- Health copy is educational preparation, not diagnosis, prescribing, or a substitute for a travel-medicine clinician or local emergency services.
- Do not infer sensitive medical conditions from calendar, email, or chat content. If the user volunteers a health consideration, use it only for the current plan unless they explicitly ask to save it.
- Keep an audit trail of which normalized source records affected each warning so a user can understand and challenge the plan.

## Suggested implementation slices

### Slice 1 — trustworthy itinerary core

- Add trip and itinerary Pydantic models without payment or booking fields.
- Implement `/agent/trips/plan` as a read-only planning endpoint.
- Normalize destinations and dates, create day blocks, and return an honest empty/error state when no live provider is configured.
- Add source metadata and freshness to every result.
- Add durable trip models and a separate `OpenPip/travel/trips` output directory.
- Add a gated `/agent/trips/sync` pass that reads the completed Study Me manifest only.
- Save scratch plans to the same trip directory without requiring the Study Me gate.

### Slice 2 — route map and weather

- Add geocoding and route-provider adapters.
- Render route geometry, legs, distance, duration, and elevation in the existing `/trips` surface.
- Add weather, UV, timezone, and daylight summaries per day.
- Add Nova Grounding synthesis with retained citations and a visible research/loading state.

### Slice 3 — health and preparation

- Add CDC/WHO links and a requirement-vs-recommendation distinction.
- Add altitude preparation logic and tests around sleeping-altitude gains.
- Add activity/condition-driven gear checklist with CDC/NPS rationale.

### Slice 4 — hazard corridor and water context

- Add NPS/land-manager alerts and closures for supported U.S. outdoor destinations.
- Add U.S. drought and water-source context, with explicit coverage limits.
- Add official fire/AQI signals and route-impact warnings.

### Slice 5 — durable plans and verification

- Persist the itinerary and source snapshot, not provider tokens, passport numbers, medical records, or payment data.
- Add refresh, stale-source indicators, and a “verify with official source” checklist.
- Test that no API or UI payload contains payment or booking fields and that unconfigured sources never produce fabricated results.

## Acceptance criteria for the first build

- A user can create a multi-day itinerary with at least two stops and see local dates/time zones.
- The plan displays route geometry plus a text-only route summary when maps fail or are unavailable.
- Weather and UV are clearly labeled as forecast/context, with retrieval time and source link.
- A high-altitude itinerary reports sleeping elevation, daily elevation gain, acclimatization prompts, and urgent escalation language without prescribing medication.
- Outdoor plans show a baseline gear checklist and add water, sun, cold/rain, navigation, and emergency items when conditions warrant.
- Health output distinguishes CDC/WHO recommendations from entry requirements and asks the user to verify dynamic requirements with an official source.
- The overview supports both a reviewed, read-only detected trip and a new scratch plan.
- Detected trips show evidence links and confidence before a preparation plan is generated.
- Nova Grounding citations and retrieval metadata are retained in the response and displayed with consequential research claims.
- A confirmed closure or severe route hazard is visible before the itinerary is presented as workable.
- There is no booking checkout, payment method, card storage, reservation claim, or booking side effect anywhere in the flow.
- Every warning can be traced to a source URL and retrieval timestamp.

## Sources

- [Amazon Nova Web Grounding](https://docs.aws.amazon.com/nova/latest/nova2-userguide/web-grounding.html) and [Nova 2 Lite responsible AI information](https://docs.aws.amazon.com/ai/responsible-ai/nova-2-lite/overview.html)
- [Gmail messages.list](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list) and [Calendar events.list](https://developers.google.com/calendar/api/v3/reference/events/list)
- [NWS API Web Service](https://www.weather.gov/documentation/services-web-api)
- [Open-Meteo Weather Forecast API](https://open-meteo.com/en/docs), [terms](https://open-meteo.com/en/terms), and [data license](https://open-meteo.com/en/license)
- [CDC Travelers’ Health destinations](https://wwwnc.cdc.gov/travel/destinations/list/), [vaccine guide](https://wwwnc.cdc.gov/travel/page/vaccine-guide), [Yellow Book country guidance](https://www.cdc.gov/yellow-book/hcp/preparing-international-travelers/yellow-fever-vaccine-and-malaria-prevention-information-by-country.html), and [animal safety](https://wwwnc.cdc.gov/travel/page/be-safe-around-animals)
- [WHO vaccines and travel](https://www.who.int/travel-advice/vaccines) and [Disease Outbreak News](https://www.who.int/emergencies/disease-outbreak-news)
- [IATA Travel Centre](https://www.iata.org/en/travel-centre/) and [Timatic](https://www.iata.org/timatic)
- [U.S. State Department Travel Advisories](https://travel.state.gov/en/international-travel/travel-advisories.html)
- [EPA UV Index Scale](https://www.epa.gov/sunsafety/uv-index-scale-0) and [WHO UV radiation guidance](https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation)
- [U.S. Drought Monitor](https://www.drought.gov/data-maps-tools/us-drought-monitor), [Drought.gov data downloads](https://www.drought.gov/data-download), and [USGS Water Data APIs](https://api.waterdata.usgs.gov/)
- [NPS API documentation](https://www.nps.gov/subjects/developer/api-documentation.htm), [NPS Ten Essentials](https://www.nps.gov/articles/10essentials.htm), [Hike Smart](https://www.nps.gov/articles/hiking-safety.htm), and [Trip Planning Guide](https://www.nps.gov/subjects/healthandsafety/trip-planning-guide.htm)
- [Recreation Information Database](https://ridb.recreation.gov/)
- [CDC High-Altitude Travel and Altitude Illness](https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html) and [Wilderness Medical Society 2024 guideline](https://doi.org/10.1016/j.wem.2023.05.013)
- [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/) and [Geocoding API storage rules](https://docs.mapbox.com/api/search/geocoding/)
- [OpenRouteService API docs](https://openrouteservice.org/dev/)
- [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/) and [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/)
- [AirNow API documentation](https://docs.airnowapi.org/), [NASA FIRMS web services](https://firms.modaps.eosdis.nasa.gov/web-services/), and [USGS earthquake feeds](https://earthquake.usgs.gov/earthquakes/feed/)
