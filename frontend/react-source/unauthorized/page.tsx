"use client";

import { proxyLoginUrl } from "@/lib/proxy";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main
      style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      className="bg-gradient-to-br from-rose-50 via-background to-amber-50 dark:from-background dark:via-background dark:to-background px-4 relative"
    >
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="max-w-sm w-full shadow-lg">
        <CardContent className="p-8 space-y-8">
          <div className="flex items-center justify-center">
            <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <ShieldX className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Access denied
            </h1>
            <p className="text-sm text-muted-foreground">
              This app is private.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full h-11 text-sm font-medium"
            onClick={() => { window.location.href = proxyLoginUrl("/tasks"); }}
          >
            Sign in with a different account
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
