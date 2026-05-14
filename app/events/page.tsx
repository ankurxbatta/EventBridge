"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PostedEvent } from "@/types";
import { getEvents } from "@/lib/store";

const STATUS_CONFIG = {
  open: { label: "Open", cls: "badge-green" },
  "in-progress": { label: "In progress", cls: "badge-amber" },
  closed: { label: "Closed", cls: "badge-default" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

const ALL_CATS = ["All", "Venue", "Sound", "Lighting", "Visuals", "Food", "Security", "Marketing", "Artists / Performers"];

export default function EventsPage() {
  const [events, setEvents] = useState<PostedEvent[]>([]);
  const [filter, setFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in-progress">("all");

  useEffect(() => {
    setEvents(getEvents());
  }, []);

  const filtered = events.filter((e) => {
    const catMatch = filter === "All" || e.selectedServices.includes(filter);
    const statusMatch = statusFilter === "all" || e.status === statusFilter;
    return catMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="section-label mb-1">Event board</p>
            <h1 className="text-2xl font-extrabold text-ink">Open events</h1>
            <p className="text-ink-muted text-sm mt-1">Organizers looking for providers. Submit a quote on any event.</p>
          </div>
          <Link href="/organizer" className="btn btn-primary btn-sm flex-shrink-0">
            + Post your event
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(["all", "open", "in-progress"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-secondary"}`}
            >
              {s === "all" ? "All status" : s === "open" ? "Open" : "In progress"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-1">
          {ALL_CATS.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`btn btn-sm flex-shrink-0 ${filter === c ? "btn-primary" : "btn-secondary"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-xs text-ink-faint mb-5">{filtered.length} event{filtered.length !== 1 ? "s" : ""} found</p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-ink-muted text-sm">No events match this filter.</p>
            <button onClick={() => { setFilter("All"); setStatusFilter("all"); }} className="btn btn-ghost btn-sm mt-3">Clear filters</button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => {
              const sc = STATUS_CONFIG[event.status];
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="card card-hover p-5 flex flex-col gap-3 group"
                >
                  {/* Status + time */}
                  <div className="flex items-center justify-between">
                    <span className={`badge ${sc.cls}`}>{sc.label}</span>
                    <span className="text-xs text-ink-faint">{timeAgo(event.createdAt)}</span>
                  </div>

                  {/* Name + type */}
                  <div>
                    <h2 className="text-base font-bold text-ink group-hover:underline leading-tight">{event.blueprint.eventName}</h2>
                    <p className="text-xs text-ink-muted mt-0.5">{event.blueprint.eventType}</p>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {event.blueprint.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {event.blueprint.audienceSize}
                    </span>
                    <span>{event.blueprint.estimatedBudget}</span>
                  </div>

                  {/* Services */}
                  <div className="flex flex-wrap gap-1.5">
                    {event.selectedServices.slice(0, 4).map((s) => (
                      <span key={s} className="badge badge-default text-xs">{s}</span>
                    ))}
                    {event.selectedServices.length > 4 && (
                      <span className="badge badge-default text-xs">+{event.selectedServices.length - 4}</span>
                    )}
                  </div>

                  {/* Quote count */}
                  <div className="flex items-center justify-between pt-1 border-t border-surface-border text-xs text-ink-faint">
                    <span>by {event.organizerName}</span>
                    <span>{event.quotes.length} quote{event.quotes.length !== 1 ? "s" : ""}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
