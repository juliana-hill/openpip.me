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

If the assembled result is missing required signal categories, it makes up to
four bounded gap-review calls using `gap-review.md` as the focus. The template
contains two output schemas: the normal conditions/health shape and the richer
itinerary shape selected when the focus begins with `a practical`.
