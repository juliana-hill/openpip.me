# Production travel-planning prompts

These files are the prompts used by the production backend image currently
serving OpenPip:

- Cloud Run service: `openpip-backend`
- Revision: `openpip-backend-00005-q5r`
- Image tag: `01a72bb`
- Git commit: `01a72bb` (`Fix travel research category validation`)

The deterministic pipeline builds each Nova Grounding request from
`trip-research-template.md`, then supplies one of the stage focus prompts:

1. `stage-01-conditions.md`
2. `stage-02-health-and-hazards.md`
3. `stage-03-itinerary.md`

Each later stage receives the Python-assembled research from earlier stages and
is told to investigate only missing or incomplete information. If required
sections are still missing, the backend issues targeted Markdown completion
calls; Python merges those responses into the saved aggregate. Nova is never
asked to return or merge JSON.
