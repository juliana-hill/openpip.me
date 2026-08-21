import Link from "next/link";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TravelPage() {
  return (
    <main className="app-shell">
      <Link href="/" className="back-link">← Dashboard</Link>
      <section className="travel-placeholder">
        <Card accent>
          <CardHeader>
            <Map size={24} aria-hidden="true" />
            <CardTitle>Business travel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="briefing-copy">OpenPip will help prepare professional itineraries, coordinate meetings, and propose travel actions. Any booking or outbound call will require your explicit approval.</p>
            <Button disabled>Coming next</Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
