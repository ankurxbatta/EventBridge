/**
 * In-memory + localStorage store.
 * Simulates a real DB for the hackathon — no backend needed.
 */

import { PostedEvent, ProviderProfile, Quote } from "@/types";

const EVENTS_KEY = "eventbridge_events";
const PROVIDERS_KEY = "eventbridge_providers";
const ORGANIZER_SESSION_KEY = "eventbridge_organizer_session";
const PROVIDER_SESSION_KEY = "eventbridge_provider_session";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrganizerSession {
  name: string;
  contact: string; // email — used as identity key
}

export interface ProviderSession {
  name: string;
  contact: string; // email — used as identity key
  profileId: string;
  category: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function readOne<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeOne<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Session: Organizer ───────────────────────────────────────────────────────

export function getOrganizerSession(): OrganizerSession | null {
  return readOne<OrganizerSession>(ORGANIZER_SESSION_KEY);
}

export function setOrganizerSession(session: OrganizerSession): void {
  writeOne(ORGANIZER_SESSION_KEY, session);
}

export function clearOrganizerSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ORGANIZER_SESSION_KEY);
}

// ─── Session: Provider ────────────────────────────────────────────────────────

export function getProviderSession(): ProviderSession | null {
  return readOne<ProviderSession>(PROVIDER_SESSION_KEY);
}

export function setProviderSession(session: ProviderSession): void {
  writeOne(PROVIDER_SESSION_KEY, session);
}

export function clearProviderSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROVIDER_SESSION_KEY);
}

// ─── Events ───────────────────────────────────────────────────────────────────

export function getEvents(): PostedEvent[] {
  const stored = read<PostedEvent>(EVENTS_KEY);
  if (stored.length === 0) {
    const seeded = seedEvents();
    write(EVENTS_KEY, seeded);
    return seeded;
  }
  return stored;
}

export function getEvent(id: string): PostedEvent | null {
  return getEvents().find((e) => e.id === id) ?? null;
}

/** Returns events owned by the current organizer session */
export function getMyEvents(): PostedEvent[] {
  const session = getOrganizerSession();
  if (!session) return [];
  return getEvents().filter((e) => e.organizerContact === session.contact);
}

export function saveEvent(
  event: Omit<PostedEvent, "id" | "createdAt" | "quotes">
): PostedEvent {
  const events = getEvents();
  const newEvent: PostedEvent = {
    ...event,
    id: uid(),
    createdAt: new Date().toISOString(),
    quotes: [],
  };
  write(EVENTS_KEY, [newEvent, ...events]);
  return newEvent;
}

export function addQuote(
  eventId: string,
  quote: Omit<Quote, "id" | "createdAt" | "status" | "eventId">
): Quote {
  const events = getEvents();
  const idx = events.findIndex((e) => e.id === eventId);
  if (idx === -1) throw new Error("Event not found");

  const newQuote: Quote = {
    ...quote,
    id: uid(),
    eventId,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  events[idx].quotes.push(newQuote);
  if (events[idx].status === "open") events[idx].status = "in-progress";
  write(EVENTS_KEY, events);
  return newQuote;
}

export function updateQuoteStatus(
  eventId: string,
  quoteId: string,
  status: Quote["status"]
): void {
  const events = getEvents();
  const ev = events.find((e) => e.id === eventId);
  if (!ev) return;
  const q = ev.quotes.find((q) => q.id === quoteId);
  if (q) q.status = status;
  write(EVENTS_KEY, events);
}

/** Returns all quotes submitted by the current provider session (across all events) */
export function getMyQuotes(): Array<{ quote: Quote; event: PostedEvent }> {
  const session = getProviderSession();
  if (!session) return [];
  const events = getEvents();
  const results: Array<{ quote: Quote; event: PostedEvent }> = [];
  for (const event of events) {
    for (const quote of event.quotes) {
      if (quote.providerName === session.name && quote.providerCategory === session.category) {
        results.push({ quote, event });
      }
    }
  }
  return results.sort(
    (a, b) => new Date(b.quote.createdAt).getTime() - new Date(a.quote.createdAt).getTime()
  );
}

// ─── Providers ────────────────────────────────────────────────────────────────

export function getProviders(): ProviderProfile[] {
  const stored = read<ProviderProfile>(PROVIDERS_KEY);
  if (stored.length === 0) {
    const seeded = seedProviders();
    write(PROVIDERS_KEY, seeded);
    return seeded;
  }
  return stored;
}

export function getProvider(id: string): ProviderProfile | null {
  return getProviders().find((p) => p.id === id) ?? null;
}

export function saveProvider(
  profile: Omit<
    ProviderProfile,
    "id" | "createdAt" | "eventsCompleted" | "rating" | "verified"
  >
): ProviderProfile {
  const providers = getProviders();
  const existing = providers.findIndex((p) => p.contact === profile.contact);

  const newProfile: ProviderProfile = {
    ...profile,
    id: existing >= 0 ? providers[existing].id : uid(),
    createdAt:
      existing >= 0 ? providers[existing].createdAt : new Date().toISOString(),
    eventsCompleted: existing >= 0 ? providers[existing].eventsCompleted : 0,
    rating: existing >= 0 ? providers[existing].rating : 0,
    verified: false,
  };

  if (existing >= 0) {
    providers[existing] = newProfile;
  } else {
    providers.push(newProfile);
  }
  write(PROVIDERS_KEY, providers);
  return newProfile;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

function seedEvents(): PostedEvent[] {
  return [
    {
      id: "seed-1",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "open",
      organizerName: "Maya Chen",
      organizerContact: "maya@underground.ca",
      blueprint: {
        eventName: "Neon Forest Gathering",
        eventType: "Underground Music & Art Event",
        location: "Vancouver, BC",
        audienceSize: "150 people",
        duration: "1 night",
        estimatedBudget: "$8,000",
        vibe: "Immersive, psychedelic, safe, artistic, community-focused",
        summary:
          "A one-night underground music and art event designed around immersive sound, lighting, visual projections, and a safe community environment.",
        requiredServices: ["Venue", "Sound", "Lighting", "Visuals", "Security"],
        risks: [
          "Sound permits required for late-night music.",
          "Crowd safety planning needed for 150 attendees.",
          "Power access must be confirmed before booking sound and visuals.",
        ],
      },
      selectedServices: ["Sound", "Lighting", "Visuals", "Security"],
      budgetAllocation: { Sound: 2200, Lighting: 1600, Visuals: 1200, Security: 1000 },
      quotes: [
        {
          id: "q-seed-1",
          eventId: "seed-1",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: "pending",
          providerId: "p-seed-1",
          providerName: "Bassline Audio",
          providerCategory: "Sound",
          providerLocation: "Vancouver, BC",
          price: "$1,800",
          message:
            "Hi Maya, we'd love to be part of Neon Forest Gathering. We've done 20+ underground events in Vancouver and have a full bass-heavy rig perfect for 150 people.",
          availability: "Available",
          experience: "8 years, 200+ events",
          portfolioLinks: [],
        },
      ],
    },
    {
      id: "seed-2",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "open",
      organizerName: "James Okafor",
      organizerContact: "james@collective.io",
      blueprint: {
        eventName: "Solstice Community Fest",
        eventType: "Outdoor Community Festival",
        location: "Vancouver, BC",
        audienceSize: "300 people",
        duration: "1 day",
        estimatedBudget: "$15,000",
        vibe: "Vibrant, inclusive, family-friendly, outdoor, local artists",
        summary:
          "A daytime outdoor community festival celebrating local artists, food vendors, and live music in a park setting.",
        requiredServices: ["Venue", "Sound", "Food", "Marketing", "Security", "Artists / Performers"],
        risks: [
          "Weather backup plan essential.",
          "Permit for outdoor amplified music required.",
          "Insurance and liability coverage needed.",
        ],
      },
      selectedServices: ["Sound", "Food", "Marketing", "Security", "Artists / Performers"],
      budgetAllocation: { Sound: 3000, Food: 2000, Marketing: 1500, Security: 2000, "Artists / Performers": 4000 },
      quotes: [],
    },
    {
      id: "seed-3",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "in-progress",
      organizerName: "Priya Sharma",
      organizerContact: "priya@corp.com",
      blueprint: {
        eventName: "Q3 Pulse Summit",
        eventType: "Corporate Tech Conference",
        location: "Vancouver, BC",
        audienceSize: "80 people",
        duration: "1 day",
        estimatedBudget: "$12,000",
        vibe: "Professional, engaging, innovative, networking-focused",
        summary:
          "A one-day internal tech conference with keynote speakers, breakout sessions, and networking dinner.",
        requiredServices: ["Venue", "Sound", "Lighting", "Food", "Marketing"],
        risks: [
          "AV setup must be tested morning of event.",
          "Dietary restrictions need advance collection.",
        ],
      },
      selectedServices: ["Venue", "Sound", "Food"],
      budgetAllocation: { Venue: 5000, Sound: 2500, Food: 3000 },
      quotes: [
        {
          id: "q-seed-3",
          eventId: "seed-3",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: "accepted",
          providerId: "p-seed-2",
          providerName: "Speakeasy Venues",
          providerCategory: "Venue",
          providerLocation: "Vancouver, BC",
          price: "$4,800",
          message:
            "We have a perfect downtown space for your summit — full AV included, capacity 100, breakout rooms available.",
          availability: "Available",
          experience: "5 years corporate events",
          portfolioLinks: [],
        },
      ],
    },
  ];
}

function seedProviders(): ProviderProfile[] {
  return [
    {
      id: "p-seed-1",
      createdAt: new Date().toISOString(),
      name: "Bassline Audio",
      category: "Sound",
      location: "Vancouver, BC",
      priceRange: "$1,200 – $2,500",
      bio: "Vancouver's go-to sound company for underground electronic and community music events.",
      experience: "8 years, 200+ events, specialising in bass-heavy setups for 50–500 people.",
      tags: ["Bass music", "Electronic", "Outdoor capable", "Underground"],
      portfolioLinks: [],
      contact: "bassline@example.com",
      eventsCompleted: 47,
      rating: 4.9,
      verified: true,
    },
    {
      id: "p-seed-2",
      createdAt: new Date().toISOString(),
      name: "Speakeasy Venues",
      category: "Venue",
      location: "Vancouver, BC",
      priceRange: "$1,500 – $3,500",
      bio: "Unique underground and alternative event spaces across Vancouver.",
      experience: "5 years, specialising in alternative venues for 50–350 people.",
      tags: ["Underground", "Alternative", "Sound-ready", "Night events"],
      portfolioLinks: [],
      contact: "speakeasy@example.com",
      eventsCompleted: 89,
      rating: 4.8,
      verified: true,
    },
    {
      id: "p-seed-3",
      createdAt: new Date().toISOString(),
      name: "Aurora Visuals",
      category: "Visuals",
      location: "Vancouver, BC",
      priceRange: "$600 – $1,500",
      bio: "Immersive projection mapping and live VJ sets for art-forward events.",
      experience: "6 years, 120+ events, psychedelic and immersive aesthetics.",
      tags: ["Projection mapping", "Live VJ", "Psychedelic", "Immersive"],
      portfolioLinks: [],
      contact: "aurora@example.com",
      eventsCompleted: 34,
      rating: 4.7,
      verified: false,
    },
    {
      id: "p-seed-4",
      createdAt: new Date().toISOString(),
      name: "GlowGrid Lighting",
      category: "Lighting",
      location: "Burnaby, BC",
      priceRange: "$800 – $2,000",
      bio: "Full-service lighting design for music events, festivals, and corporate.",
      experience: "7 years, 180+ events, LED and atmospheric design.",
      tags: ["Stage lighting", "LED", "Atmospheric", "Music events"],
      portfolioLinks: [],
      contact: "glowgrid@example.com",
      eventsCompleted: 61,
      rating: 4.6,
      verified: true,
    },
    {
      id: "p-seed-5",
      createdAt: new Date().toISOString(),
      name: "SafeCrowd Vancouver",
      category: "Security",
      location: "Vancouver, BC",
      priceRange: "$900 – $1,800",
      bio: "Licensed event security with a community-first approach.",
      experience: "10 years, 300+ events, late-night and festival specialists.",
      tags: ["Crowd control", "Late-night", "Festivals", "Harm reduction"],
      portfolioLinks: [],
      contact: "safecrowd@example.com",
      eventsCompleted: 112,
      rating: 4.8,
      verified: true,
    },
  ];
}
