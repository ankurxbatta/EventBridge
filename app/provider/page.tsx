"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ProviderProfile, PostedEvent } from "@/types";
import { getProviders, saveProvider, getEvents } from "@/lib/store";

const CATEGORIES = ["Venue", "Sound", "Lighting", "Visuals", "Food", "Security", "Marketing", "Artists / Performers"];

const CATEGORY_ICONS: Record<string, string> = {
  Venue: "🏛️", Sound: "🔊", Lighting: "💡", Visuals: "🎨",
  Food: "🍔", Security: "🛡️", Marketing: "📣", "Artists / Performers": "🎤",
};

type View = "landing" | "profile-form" | "profile-saved" | "browse";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function ProviderPage() {
  const [view, setView] = useState<View>("landing");
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [events, setEvents] = useState<PostedEvent[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Profile form
  const [form, setForm] = useState({
    name: "", category: "", location: "Vancouver, BC",
    priceRange: "", bio: "", experience: "",
    tags: "", portfolioLinks: "", contact: "",
  });
  const [saving, setSaving] = useState(false);
  const [savedProfile, setSavedProfile] = useState<ProviderProfile | null>(null);

  useEffect(() => {
    setProviders(getProviders());
    setEvents(getEvents());
  }, []);

  const handleSaveProfile = async () => {
    if (!form.name || !form.category || !form.contact) return;
    setSaving(true);
    try {
      const profile = saveProvider({
        name: form.name,
        category: form.category,
        location: form.location,
        priceRange: form.priceRange,
        bio: form.bio,
        experience: form.experience,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        portfolioLinks: form.portfolioLinks.split(",").map((t) => t.trim()).filter(Boolean),
        contact: form.contact,
      });
      setSavedProfile(profile);
      setProviders(getProviders());
      setView("profile-saved");
    } finally {
      setSaving(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    const open = e.status !== "closed";
    const catMatch = categoryFilter === "All" || e.selectedServices.includes(categoryFilter);
    return open && catMatch;
  });

  // ── Landing ────────────────────────────────────────────────────────────────
  if (view === "landing") {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
          <div className="text-center mb-12">
            <p className="section-label mb-3">For service providers</p>
            <h1 className="text-4xl font-extrabold text-ink mb-4">You're already being matched.<br /><span className="text-ink-muted">Claim your place.</span></h1>
            <p className="text-ink-muted max-w-xl mx-auto text-sm leading-relaxed">
              Organizers are already using EventOps AI to find providers like you. Build your profile, browse open events, and submit quotes — no cold pitching required.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            <button onClick={() => setView("profile-form")} className="card card-hover p-6 text-left">
              <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h2 className="font-bold text-ink mb-2">Build my profile</h2>
              <p className="text-sm text-ink-muted">Set your category, experience, price range, and the events you love working.</p>
              <div className="mt-4 text-sm font-medium text-ink flex items-center gap-1">Start here <span>→</span></div>
            </button>

            <button onClick={() => setView("browse")} className="card card-hover p-6 text-left">
              <div className="w-10 h-10 rounded-xl bg-surface-sunken flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h2 className="font-bold text-ink mb-2">Browse open events</h2>
              <p className="text-sm text-ink-muted">See event briefs from organizers who need exactly what you offer.</p>
              <div className="mt-4 text-sm font-medium text-ink-muted flex items-center gap-1">{events.filter((e) => e.status !== "closed").length} open events <span>→</span></div>
            </button>
          </div>

          {/* Community providers */}
          <div>
            <p className="section-label mb-4">Community providers ({providers.length})</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((p) => (
                <div key={p.id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-ink text-sm">{p.name}</p>
                      <p className="text-xs text-ink-muted">{p.category} · {p.location}</p>
                    </div>
                    <span className="text-xl">{CATEGORY_ICONS[p.category] ?? "🔧"}</span>
                  </div>
                  <p className="text-xs text-ink-muted mb-3 line-clamp-2">{p.bio}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-faint">{p.priceRange}</span>
                    {p.eventsCompleted > 0 && <span className="text-ink-faint">{p.eventsCompleted} events</span>}
                    {p.verified && <span className="badge badge-green">Verified</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Profile form ───────────────────────────────────────────────────────────
  if (view === "profile-form") {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 sm:px-6 py-10">
          <button onClick={() => setView("landing")} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>

          <h1 className="text-2xl font-extrabold text-ink mb-1">Build your provider profile</h1>
          <p className="text-ink-muted text-sm mb-8">This is what organizers see when they're matched to you.</p>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Name / Company *</label>
                <input className="input" placeholder="Bassline Audio" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Service category *</label>
                <select className="input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  <option value="">Select…</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Location</label>
                <input className="input" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
              </div>
              <div>
                <label className="label">Price range</label>
                <input className="input" placeholder="$800 – $2,000" value={form.priceRange} onChange={(e) => setForm((p) => ({ ...p, priceRange: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="label">Bio — what you do</label>
              <textarea className="input" rows={3} placeholder="Short description of your service and what makes you great at it." value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
            </div>

            <div>
              <label className="label">Experience</label>
              <textarea className="input" rows={2} placeholder="e.g. 8 years, 200+ events across Vancouver. Specialise in underground electronic and community events." value={form.experience} onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))} />
            </div>

            <div>
              <label className="label">Tags (comma-separated)</label>
              <input className="input" placeholder="Bass music, Outdoor, Underground, 200-person setup" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
            </div>

            <div>
              <label className="label">Portfolio links (comma-separated)</label>
              <input className="input" placeholder="instagram.com/…, soundcloud.com/…" value={form.portfolioLinks} onChange={(e) => setForm((p) => ({ ...p, portfolioLinks: e.target.value }))} />
            </div>

            <div>
              <label className="label">Contact email *</label>
              <input className="input" type="email" placeholder="you@email.com" value={form.contact} onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))} />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={!form.name || !form.category || !form.contact || saving}
              className="btn btn-primary btn-lg w-full justify-center"
            >
              {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />Saving…</> : "Save profile →"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Profile saved ──────────────────────────────────────────────────────────
  if (view === "profile-saved" && savedProfile) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center mx-auto mb-6 text-2xl">
            {CATEGORY_ICONS[savedProfile.category] ?? "🔧"}
          </div>
          <h1 className="text-2xl font-extrabold text-ink mb-2">{savedProfile.name}</h1>
          <p className="text-ink-muted text-sm mb-1">{savedProfile.category} · {savedProfile.location}</p>
          <p className="text-ink-muted text-sm mb-8">{savedProfile.priceRange}</p>

          <div className="card p-5 text-left mb-6">
            <p className="section-label mb-3">Your profile is live</p>
            <div className="space-y-2 text-sm text-ink-muted">
              <p>✓ You'll appear in organizer vendor matches for {savedProfile.category} events</p>
              <p>✓ Organizers can see your bio, experience, and price range</p>
              <p>✓ Browse open events and submit quotes directly</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setView("browse")} className="btn btn-primary">
              Browse open events →
            </button>
            <button onClick={() => { setView("profile-form"); }} className="btn btn-secondary">
              Edit profile
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Browse events ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="section-label mb-1">For providers</p>
            <h1 className="text-2xl font-extrabold text-ink">Open events</h1>
            <p className="text-ink-muted text-sm mt-1">Events needing providers. Click any to submit a quote.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView("profile-form")} className="btn btn-secondary btn-sm">Edit profile</button>
            <Link href="/events" className="btn btn-ghost btn-sm">Full board →</Link>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`btn btn-sm flex-shrink-0 ${categoryFilter === c ? "btn-primary" : "btn-secondary"}`}
            >
              {c !== "All" && <span>{CATEGORY_ICONS[c]}</span>} {c}
            </button>
          ))}
        </div>

        <p className="text-xs text-ink-faint mb-4">{filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} match your category</p>

        {filteredEvents.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-ink-muted text-sm">No open events in this category right now.</p>
            <button onClick={() => setCategoryFilter("All")} className="btn btn-ghost btn-sm mt-3">Show all</button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className="card card-hover p-5 flex flex-col gap-3 group">
                <div className="flex items-center justify-between">
                  <span className="badge badge-green">Open</span>
                  <span className="text-xs text-ink-faint">{timeAgo(event.createdAt)}</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink group-hover:underline">{event.blueprint.eventName}</h2>
                  <p className="text-xs text-ink-muted mt-0.5">{event.blueprint.location} · {event.blueprint.audienceSize}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {event.selectedServices.map((s) => (
                    <span key={s} className={`badge text-xs ${categoryFilter !== "All" && s === categoryFilter ? "badge-ink" : "badge-default"}`}>{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-ink-faint pt-1 border-t border-surface-border">
                  <span>{event.blueprint.estimatedBudget}</span>
                  <span>{event.quotes.length} quote{event.quotes.length !== 1 ? "s" : ""}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
