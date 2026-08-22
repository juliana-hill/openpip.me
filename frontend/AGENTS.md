# Frontend runtime rules

The active frontend runtime is Express.js + HJS + Babel. Keep one HJS view and
one compiled Babel entry point per route. The copied travel-agent React/CSS
files are source material; do not reintroduce Next.js, Vite, browser databases,
or service workers. Never add demo, mock, fixture, seeded, or fake data.
