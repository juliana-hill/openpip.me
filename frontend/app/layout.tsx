import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "OpenPip",
  description: "An approval-first professional agent.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
