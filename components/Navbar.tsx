"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  getOrganizerSession,
  getProviderSession,
  clearOrganizerSession,
  clearProviderSession,
} from "@/lib/store";

const NAV_LINKS = [
  { href: "/events",    label: "Browse Events" },
  { href: "/organizer", label: "Plan Event" },
  { href: "/provider",  label: "Join as Provider" },
];

export default function Navbar() {
  const path   = usePathname();
  const router = useRouter();
  const [open,         setOpen]         = useState(false);
  const [orgSession,   setOrgSession]   = useState<{ name: string; contact: string } | null>(null);
  const [provSession,  setProvSession]  = useState<{ name: string; category: string; contact: string; profileId: string } | null>(null);
  const [showRoles,    setShowRoles]    = useState(false);

  useEffect(() => {
    const refresh = () => {
      setOrgSession(getOrganizerSession());
      setProvSession(getProviderSession());
    };
    refresh();
    window.addEventListener("storage", refresh);
    // also refresh on path change
    return () => window.removeEventListener("storage", refresh);
  }, [path]);

  const hasAnySession = !!orgSession || !!provSession;
  const activeRole = path.startsWith("/provider") ? "provider" : path.startsWith("/organizer") ? "organizer" : null;

  const handleClearOrg = () => {
    clearOrganizerSession();
    setOrgSession(null);
    setShowRoles(false);
    router.refresh();
  };

  const handleClearProv = () => {
    clearProviderSession();
    setProvSession(null);
    setShowRoles(false);
    router.refresh();
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
          <span className="font-bold text-ink text-sm tracking-tight">EventBridge</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1">
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

        {/* Session indicator + role switcher */}
        <div className="hidden md:flex items-center gap-2">
          {hasAnySession ? (
            <div className="relative">
              <button
                onClick={() => setShowRoles((p) => !p)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-surface-border bg-surface-sunken hover:border-ink/20 transition-colors text-sm"
              >
                <div className="flex items-center gap-1.5">
                  {orgSession && (
                    <span className="flex items-center gap-1 text-xs font-medium text-ink">
                      <span className="w-2 h-2 rounded-full bg-accent-green" />
                      {orgSession.name.split(" ")[0]}
                    </span>
                  )}
                  {orgSession && provSession && <span className="text-ink-faint mx-0.5">·</span>}
                  {provSession && (
                    <span className="flex items-center gap-1 text-xs font-medium text-ink">
                      <span className="w-2 h-2 rounded-full bg-accent-blue" />
                      {provSession.name.split(" ")[0]}
                    </span>
                  )}
                </div>
                <svg className={`w-3.5 h-3.5 text-ink-faint transition-transform ${showRoles ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {showRoles && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl border border-surface-border shadow-card-hover z-50 overflow-hidden animate-scale-in">
                  <div className="p-3 border-b border-surface-border">
                    <p className="text-xs text-ink-faint font-medium">Active sessions</p>
                  </div>

                  {orgSession && (
                    <div className="p-3 border-b border-surface-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent-green flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-ink">{orgSession.name}</p>
                            <p className="text-xs text-ink-faint">Organizer</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href="/organizer" onClick={() => setShowRoles(false)} className="text-xs text-accent-blue hover:underline">My events</Link>
                          <button onClick={handleClearOrg} className="text-xs text-ink-faint hover:text-accent-red transition-colors">Sign out</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {provSession && (
                    <div className="p-3 border-b border-surface-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent-blue flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-ink">{provSession.name}</p>
                            <p className="text-xs text-ink-faint">Provider · {provSession.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href="/provider" onClick={() => setShowRoles(false)} className="text-xs text-accent-blue hover:underline">My quotes</Link>
                          <button onClick={handleClearProv} className="text-xs text-ink-faint hover:text-accent-red transition-colors">Sign out</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-3 space-y-1">
                    {!orgSession && (
                      <Link href="/organizer" onClick={() => setShowRoles(false)} className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink transition-colors py-1">
                        <span className="w-2 h-2 rounded-full border border-ink-faint" />
                        Post an event as organizer
                      </Link>
                    )}
                    {!provSession && (
                      <Link href="/provider" onClick={() => setShowRoles(false)} className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink transition-colors py-1">
                        <span className="w-2 h-2 rounded-full border border-ink-faint" />
                        Join as provider
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/provider"   className="btn btn-secondary btn-sm">List my services</Link>
              <Link href="/organizer"  className="btn btn-primary   btn-sm">Plan an event</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-md text-ink-muted hover:bg-surface-sunken transition-colors"
          onClick={() => setOpen((p) => !p)}
        >
          {open
            ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          }
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

          {/* Mobile sessions */}
          {hasAnySession && (
            <div className="pt-2 border-t border-surface-border mt-2 space-y-2">
              {orgSession && (
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-green" />
                    <span className="text-sm text-ink">{orgSession.name} <span className="text-ink-faint">(Organizer)</span></span>
                  </div>
                  <button onClick={handleClearOrg} className="text-xs text-ink-faint">Sign out</button>
                </div>
              )}
              {provSession && (
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-blue" />
                    <span className="text-sm text-ink">{provSession.name} <span className="text-ink-faint">(Provider)</span></span>
                  </div>
                  <button onClick={handleClearProv} className="text-xs text-ink-faint">Sign out</button>
                </div>
              )}
            </div>
          )}

          {!hasAnySession && (
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/provider"  onClick={() => setOpen(false)} className="btn btn-secondary btn-sm w-full justify-center">List my services</Link>
              <Link href="/organizer" onClick={() => setOpen(false)} className="btn btn-primary   btn-sm w-full justify-center">Plan an event</Link>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showRoles && <div className="fixed inset-0 z-30" onClick={() => setShowRoles(false)} />}
    </header>
  );
}
