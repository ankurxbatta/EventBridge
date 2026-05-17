import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventBridge — From idea to vendor-ready plan",
  description: "The intelligence layer for live event organizers. Turn a rough idea into a structured event plan, match vendors, and co-create with your community.",
  keywords: ["event planning", "event operations", "vendor matching", "underground events", "community events"],
  openGraph: {
    title: "EventBridge",
    description: "From messy event idea to vendor-ready plan in 60 seconds.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
