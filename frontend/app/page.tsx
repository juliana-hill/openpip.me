import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Open Performance Improvement Plan</p>
          <h1>Good morning, Juliana.</h1>
        </div>
        <Button variant="secondary">Settings</Button>
      </header>

      <section className="hero-grid" aria-label="Daily briefing">
        <Card accent>
          <CardHeader>
            <CardTitle>Today at a glance</CardTitle>
            <CardDescription>Your agent scanned the work that changed overnight.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="briefing-copy">Three items need your judgment. Nothing has been sent, scheduled, or changed.</p>
            <Button>Open review queue</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Agent status</CardTitle>
            <CardDescription>Background monitoring is active.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="status-row"><span className="status-dot" /> Connected to demo workspace</div>
            <div className="status-row muted">Last scan · 8 minutes ago</div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
