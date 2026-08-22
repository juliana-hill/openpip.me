import type { Metadata } from "next";
import { SWUpdateBanner } from "@/components/SWUpdateBanner";
import { InAppNotification } from "@/components/InAppNotification";
import { DataSync } from "@/components/DataSync";
import { ThemeLoader } from "@/components/ThemeLoader";
import "@/styles/tokens.css";

export const metadata: Metadata = {
  title: "OpenPip",
  description: "Your personal assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeLoader />
        <DataSync>
          {children}
          <SWUpdateBanner />
          <InAppNotification />
        </DataSync>
      </body>
    </html>
  );
}
