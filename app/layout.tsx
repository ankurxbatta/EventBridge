import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventOps AI — From idea to vendor-ready plan in 60 seconds",
  description:
    "EventOps AI helps live event organizers turn a rough event idea into a structured blueprint, vendor matches, and ready-to-send outreach messages.",
  keywords: ["event planning", "event operations", "vendor matching", "AI event planner"],
  openGraph: {
    title: "EventOps AI",
    description: "From messy event idea to vendor-ready plan in 60 seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
