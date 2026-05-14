"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  clearOrganizerSession,
  clearProviderSession,
  saveProvider,
  setOrganizerSession,
  setProviderSession,
} from "@/lib/store";

const NAV_LINKS = [
  { href: "/events", label: "Browse Events" },
  { href: "/organizer", label: "Plan Event" },
  { href: "/provider", label: "Join as Provider" },
];

export default function Navbar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const router = useRouter();

  const handleDemoOrganizer = () => {
    setOrganizerSession({ name: "Ankur", contact: "ankur@demo.local" });
    setDemoOpen(false);
    router.push("/organizer");
  };

  const handleDemoProvider = () => {
    const profile = saveProvider({
      name: "Ishmam",
      category: "Sound",
      location: "Vancouver, BC",
      priceRange: "$900 - $2,200",
      bio: "Live sound for underground and community events.",
      experience: "6 years, 120+ events",
      tags: ["Underground", "Live", "Warehouse"],
      portfolioLinks: ["instagram.com/ishmam-sound"],
      contact: "ishmam@demo.local",
    });

    setProviderSession({
      name: profile.name,
      contact: profile.contact,
      profileId: profile.id,
      category: profile.category,
    });
    setDemoOpen(false);
    router.push("/provider");
  };

  const handleDemoClear = () => {
    clearOrganizerSession();
    clearProviderSession();
    setDemoOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-surface-border">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-ink text-sm tracking-tight">EventOps AI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                path.startsWith(l.href)
                  ? "bg-surface-sunken text-ink"
                  : "text-ink-muted hover:text-ink hover:bg-surface-sunken"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2 relative">
          <div className="relative">
            <button
              onClick={() => setDemoOpen((p) => !p)}
              className="btn btn-ghost btn-sm"
            >
              Demo
            </button>
            {demoOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-surface-border bg-white shadow-lg p-2 z-50">
                <button
                  onClick={handleDemoOrganizer}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-surface-sunken"
                >
                  Login as Ankur (organizer)
                </button>
                <button
                  onClick={handleDemoProvider}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-surface-sunken"
                >
                  Login as Ishmam (provider)
                </button>
                <div className="h-px bg-surface-border my-1" />
                <button
                  onClick={handleDemoClear}
                  className="w-full text-left px-3 py-2 text-sm rounded-md text-ink-muted hover:bg-surface-sunken"
                >
                  Clear demo sessions
                </button>
              </div>
            )}
          </div>
          <Link href="/provider" className="btn btn-secondary btn-sm">
            List my services
          </Link>
          <Link href="/organizer" className="btn btn-primary btn-sm">
            Plan an event
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-md text-ink-muted hover:bg-surface-sunken transition-colors"
          onClick={() => setOpen((p) => !p)}
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-surface-border bg-white px-4 py-3 space-y-1 animate-fade-in">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2.5 rounded-md text-sm font-medium ${
                path.startsWith(l.href) ? "bg-surface-sunken text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => { handleDemoOrganizer(); setOpen(false); }}
              className="btn btn-ghost btn-sm w-full justify-center"
            >
              Demo: Ankur (organizer)
            </button>
            <button
              onClick={() => { handleDemoProvider(); setOpen(false); }}
              className="btn btn-ghost btn-sm w-full justify-center"
            >
              Demo: Ishmam (provider)
            </button>
            <button
              onClick={() => { handleDemoClear(); setOpen(false); }}
              className="btn btn-ghost btn-sm w-full justify-center"
            >
              Clear demo sessions
            </button>
            <Link href="/provider" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm w-full justify-center">List my services</Link>
            <Link href="/organizer" onClick={() => setOpen(false)} className="btn btn-primary btn-sm w-full justify-center">Plan an event</Link>
          </div>
        </div>
      )}
    </header>
  );
}
