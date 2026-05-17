"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { EventBlueprint, ChecklistItem } from "@/types";
import {
  saveEvent,
  setOrganizerSession,
  getOrganizerSession,
  getMyEvents,
} from "@/lib/store";
import { PostedEvent } from "@/types";

type Step = "describe" | "checklist" | "review" | "posted";

const STEPS: { id: Step; label: string }[] = [
  { id: "describe", label: "Describe" },
  { id: "checklist", label: "Checklist" },
  { id: "review", label: "Review & Post" },
  { id: "posted", label: "Posted" },
];

const PRIORITY_CONFIG = {
  "must-have": { label: "Must have", cls: "badge-red" },
  important: { label: "Important", cls: "badge-amber" },
  optional: { label: "Optional", cls: "badge-green" },
};

function parseBudget(raw: string): number {
  return parseInt(raw.replace(/[^0-9]/g, "")) || 5000;
}

function buildDefaultAllocation(
  services: string[],
  total: number
): Record<string, number> {
  if (!services.length) return {};
  const each = Math.floor(total / services.length);
  return Object.fromEntries(services.map((s) => [s, each]));
}

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

export default function OrganizerPage() {
  const router = useRouter();

  // Session state
  const [session, setSession] = useState<{ name: string; contact: string } | null>(null);
  const [myEvents, setMyEvents] = useState<PostedEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"new" | "my-events">("new");

  // Flow state
  const [step, setStep] = useState<Step>("describe");
  const [idea, setIdea] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerContact, setOrganizerContact] = useState("");
  const [blueprint, setBlueprint] = useState<EventBlueprint | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingBlueprint, setLoadingBlueprint] = useState(false);
  const [budgetAllocation, setBudgetAllocation] = useState<Record<string, number>>({});
  const [postedEventId, setPostedEventId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect returning organizer session
  useEffect(() => {
    const s = getOrganizerSession();
    if (s) {
      setSession(s);
      setOrganizerName(s.name);
      setOrganizerContact(s.contact);
      setMyEvents(getMyEvents());
      setActiveTab("my-events");
    }
  }, []);

  // ── Step 1 → 2 ─────────────────────────────────────────────────────────────
  const handleDescribeSubmit = useCallback(async () => {
    if (!idea.trim() || !organizerName.trim() || !organizerContact.trim()) return;
    setLoadingBlueprint(true);
    setError(null);
    try {
      const bpRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "blueprint", eventIdea: idea }),
      });
      const bpData = await bpRes.json();
      if (!bpRes.ok) throw new Error(bpData?.error || "Blueprint request failed");
      const bp: EventBlueprint = bpData.blueprint;
      setBlueprint(bp);

      const clRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "checklist", blueprint: bp }),
      });
      const clData = await clRes.json();
      if (!clRes.ok) throw new Error(clData?.error || "Checklist request failed");
      const items: ChecklistItem[] = Array.isArray(clData.checklist) ? clData.checklist : [];
      setChecklist(items);

      const mustHave = new Set(
        items.filter((i) => i.priority === "must-have").map((i) => i.service)
      );
      setSelected(mustHave);
      setStep("checklist");
    } catch {
      setError("Failed to generate. Please try again.");
    } finally {
      setLoadingBlueprint(false);
    }
  }, [idea, organizerName, organizerContact]);

  // ── Step 2 → 3 ─────────────────────────────────────────────────────────────
  const handleChecklistNext = () => {
    if (!blueprint || selected.size === 0) return;
    const services = Array.from(selected);
    const total = parseBudget(blueprint.estimatedBudget);
    setBudgetAllocation(buildDefaultAllocation(services, total));
    setStep("review");
  };

  // ── Step 3 → 4 ─────────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!blueprint) return;
    setPosting(true);
    try {
      const event = saveEvent({
        status: "open",
        organizerName,
        organizerContact,
        blueprint,
        selectedServices: Array.from(selected),
        budgetAllocation,
      });
      // Write session so they're recognised on return
      setOrganizerSession({ name: organizerName, contact: organizerContact });
      setSession({ name: organizerName, contact: organizerContact });
      setPostedEventId(event.id);
      setMyEvents(getMyEvents());
      setStep("posted");
    } catch {
      setError("Failed to post event.");
    } finally {
      setPosting(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Returning session banner */}
        {session && (
          <div className="flex items-center justify-between gap-4 mb-6 p-3 bg-surface-sunken rounded-xl border border-surface-border">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {session.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink leading-none">{session.name}</p>
                <p className="text-xs text-ink-muted mt-0.5">{session.contact}</p>
              </div>
            </div>
            <button
              onClick={() => {
                clearOrganizerSessionClient();
                setSession(null);
                setMyEvents([]);
                setActiveTab("new");
                setOrganizerName("");
                setOrganizerContact("");
              }}
              className="text-xs text-ink-faint hover:text-ink transition-colors"
            >
              Switch account
            </button>
          </div>
        )}

        {/* Tabs — only show when session exists */}
        {session && step !== "posted" && (
          <div className="flex gap-1 mb-8 p-1 bg-surface-sunken rounded-lg border border-surface-border">
            {(["new", "my-events"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === t
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {t === "new" ? "+ New event" : `My events (${myEvents.length})`}
              </button>
            ))}
          </div>
        )}

        {/* ── My Events tab ────────────────────────────────────────────── */}
        {activeTab === "my-events" && session && step !== "posted" && (
          <div className="animate-slide-up">
            <h1 className="text-2xl font-extrabold text-ink mb-1">My events</h1>
            <p className="text-ink-muted text-sm mb-6">Events you've posted and their quote activity.</p>

            {myEvents.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-ink-muted text-sm mb-3">You haven't posted any events yet.</p>
                <button onClick={() => setActiveTab("new")} className="btn btn-primary btn-sm">
                  Post your first event
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myEvents.map((event) => {
                  const sc = STATUS_CONFIG[event.status];
                  const pendingQuotes = event.quotes.filter((q) => q.status === "pending").length;
                  const acceptedQuotes = event.quotes.filter((q) => q.status === "accepted").length;
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="card card-hover p-5 flex flex-col gap-3 block group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-bold text-ink group-hover:underline">{event.blueprint.eventName}</h2>
                          <p className="text-xs text-ink-muted mt-0.5">
                            {event.blueprint.location} · {event.blueprint.audienceSize} · {event.blueprint.estimatedBudget}
                          </p>
                        </div>
                        <span className={`badge ${sc.cls} flex-shrink-0`}>{sc.label}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {event.selectedServices.map((s) => (
                          <span key={s} className="badge badge-default text-xs">{s}</span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-xs pt-2 border-t border-surface-border">
                        <span className="text-ink-muted">{timeAgo(event.createdAt)}</span>
                        {event.quotes.length === 0 ? (
                          <span className="text-ink-faint">No quotes yet</span>
                        ) : (
                          <>
                            {pendingQuotes > 0 && (
                              <span className="text-amber-600 font-medium">
                                {pendingQuotes} pending
                              </span>
                            )}
                            {acceptedQuotes > 0 && (
                              <span className="text-accent-green font-medium">
                                {acceptedQuotes} accepted
                              </span>
                            )}
                          </>
                        )}
                        <span className="ml-auto text-ink font-medium">View →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── New Event flow ────────────────────────────────────────────── */}
        {(activeTab === "new" || step === "posted") && (
          <>
            {/* Progress indicator */}
            {step !== "posted" && (
              <div className="mb-10">
                <div className="flex items-center gap-0">
                  {STEPS.filter((s) => s.id !== "posted").map((s, i) => {
                    const active = s.id === step;
                    const done = stepIndex > i;
                    return (
                      <div key={s.id} className="flex items-center flex-1 last:flex-none">
                        <div className={`flex items-center gap-2 ${active ? "text-ink" : done ? "text-ink-muted" : "text-ink-faint"}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            active ? "border-ink bg-ink text-white"
                            : done ? "border-ink-muted bg-surface-raised text-ink-muted"
                            : "border-surface-border bg-surface-raised text-ink-faint"
                          }`}>
                            {done ? "✓" : i + 1}
                          </div>
                          <span className="text-xs font-medium hidden sm:block">{s.label}</span>
                        </div>
                        {i < 2 && (
                          <div className={`h-px flex-1 mx-3 ${done ? "bg-ink-muted" : "bg-surface-border"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 1: Describe ─────────────────────────────────────── */}
            {step === "describe" && (
              <div className="animate-slide-up">
                <h1 className="text-2xl font-extrabold text-ink mb-1">Describe your event</h1>
                <p className="text-ink-muted text-sm mb-8">A few sentences is enough. AI handles the rest.</p>

                <div className="space-y-5">
                  {!session && (
                    <>
                      <div>
                        <label className="label">Your name *</label>
                        <input
                          className="input"
                          placeholder="e.g. Maya Chen"
                          value={organizerName}
                          onChange={(e) => setOrganizerName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label">Contact email *</label>
                        <input
                          className="input"
                          type="email"
                          placeholder="you@email.com"
                          value={organizerContact}
                          onChange={(e) => setOrganizerContact(e.target.value)}
                        />
                        <p className="text-xs text-ink-faint mt-1.5">
                          Used to identify your events on return visits. No password needed.
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="label">Tell us about your event *</label>
                    <textarea
                      className="input"
                      rows={6}
                      placeholder="Example: I want to host a one-night underground music and art event in Vancouver for around 150 people. I need sound, lights, visuals, and security. The vibe should feel immersive and community-focused. Budget is around $8,000."
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                    />
                    <p className="text-xs text-ink-faint mt-1.5">
                      Include: type, location, size, vibe, budget. More detail = better checklist.
                    </p>
                  </div>

                  {error && <p className="text-sm text-accent-red">{error}</p>}

                  <button
                    onClick={handleDescribeSubmit}
                    disabled={!idea.trim() || !organizerName.trim() || !organizerContact.trim() || loadingBlueprint}
                    className="btn btn-primary btn-lg w-full justify-center"
                  >
                    {loadingBlueprint ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                        Building checklist…
                      </>
                    ) : (
                      <>Generate checklist →</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Checklist ──────────────────────────────────── */}
            {step === "checklist" && blueprint && (
              <div className="animate-slide-up">
                <div className="mb-6">
                  <p className="section-label mb-1">AI-generated checklist</p>
                  <h1 className="text-2xl font-extrabold text-ink">{blueprint.eventName}</h1>
                  <p className="text-ink-muted text-sm mt-1">
                    {blueprint.eventType} · {blueprint.location} · {blueprint.audienceSize}
                  </p>
                </div>

                <p className="text-sm text-ink-muted mb-4">
                  Select the services you need help with. Must-haves are pre-selected.
                </p>

                <div className="space-y-3 mb-6">
                  {checklist.map((item) => {
                    const isSelected = selected.has(item.service);
                    const pc = PRIORITY_CONFIG[item.priority];
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          const next = new Set(selected);
                          if (next.has(item.service)) next.delete(item.service);
                          else next.add(item.service);
                          setSelected(next);
                        }}
                        className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all ${
                          isSelected
                            ? "border-ink bg-ink text-white"
                            : "border-surface-border bg-white hover:border-ink-muted"
                        }`}
                      >
                        <span className="text-2xl leading-none mt-0.5">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-sm font-semibold ${isSelected ? "text-white" : "text-ink"}`}>
                              {item.service}
                            </span>
                            <span className={`badge text-xs ${isSelected ? "bg-white/20 text-white border-white/20" : pc.cls}`}>
                              {pc.label}
                            </span>
                          </div>
                          <p className={`text-xs leading-relaxed ${isSelected ? "text-white/70" : "text-ink-muted"}`}>
                            {item.reason}
                          </p>
                          <p className={`text-xs font-medium mt-1.5 ${isSelected ? "text-white/60" : "text-ink-faint"}`}>
                            Est. {item.estimatedCost}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          isSelected ? "border-white bg-white" : "border-surface-border"
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-ink-faint mb-4">
                  {selected.size} service{selected.size !== 1 ? "s" : ""} selected
                </p>

                <div className="flex gap-3">
                  <button onClick={() => setStep("describe")} className="btn btn-secondary">
                    Back
                  </button>
                  <button
                    onClick={handleChecklistNext}
                    disabled={selected.size === 0}
                    className="btn btn-primary flex-1 justify-center"
                  >
                    Review & post event →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Review ─────────────────────────────────────── */}
            {step === "review" && blueprint && (
              <div className="animate-slide-up">
                <h1 className="text-2xl font-extrabold text-ink mb-1">Review & post</h1>
                <p className="text-ink-muted text-sm mb-8">
                  This is what providers will see when they browse open events.
                </p>

                <div className="card p-5 mb-5">
                  <p className="section-label mb-3">Event brief</p>
                  <h2 className="text-lg font-bold text-ink mb-3">{blueprint.eventName}</h2>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: "Type", value: blueprint.eventType },
                      { label: "Location", value: blueprint.location },
                      { label: "Audience", value: blueprint.audienceSize },
                      { label: "Duration", value: blueprint.duration },
                      { label: "Budget", value: blueprint.estimatedBudget },
                      { label: "Vibe", value: blueprint.vibe },
                    ].map((f) => (
                      <div key={f.label}>
                        <p className="text-xs text-ink-faint">{f.label}</p>
                        <p className="text-sm font-medium text-ink">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed border-t border-surface-border pt-4">
                    {blueprint.summary}
                  </p>
                </div>

                <div className="card p-5 mb-5">
                  <p className="section-label mb-3">Services needed ({selected.size})</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selected).map((s) => (
                      <span key={s} className="badge badge-default">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="card p-5 mb-8">
                  <p className="section-label mb-3">Budget allocation</p>
                  <div className="space-y-3">
                    {Object.entries(budgetAllocation).map(([cat, amt]) => {
                      const total = parseBudget(blueprint.estimatedBudget);
                      return (
                        <div key={cat} className="flex items-center gap-3">
                          <span className="text-sm text-ink w-36 flex-shrink-0 truncate">{cat}</span>
                          <input
                            type="number"
                            className="input text-sm py-1.5"
                            value={amt}
                            onChange={(e) =>
                              setBudgetAllocation((p) => ({
                                ...p,
                                [cat]: parseInt(e.target.value) || 0,
                              }))
                            }
                          />
                          <span className="text-xs text-ink-faint w-12 text-right flex-shrink-0">
                            {total > 0 ? `${Math.round((amt / total) * 100)}%` : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {error && <p className="text-sm text-accent-red mb-4">{error}</p>}

                <div className="flex gap-3">
                  <button onClick={() => setStep("checklist")} className="btn btn-secondary">
                    Back
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={posting}
                    className="btn btn-primary flex-1 justify-center"
                  >
                    {posting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                        Posting…
                      </>
                    ) : (
                      "Post event →"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 4: Posted ─────────────────────────────────────── */}
            {step === "posted" && postedEventId && blueprint && (
              <div className="animate-slide-up text-center py-8">
                <div className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-extrabold text-ink mb-2">
                  {blueprint.eventName} is live
                </h1>
                <p className="text-ink-muted mb-2 text-sm">
                  Your event brief is posted and open for provider quotes.
                </p>
                <p className="text-xs text-ink-faint mb-8">
                  Return to this page anytime with{" "}
                  <span className="font-medium text-ink">{organizerContact}</span> to manage your events.
                </p>

                <div className="card p-5 text-left mb-6">
                  <p className="section-label mb-3">What happens next</p>
                  <div className="space-y-3">
                    {[
                      "Providers in your area will see your event brief",
                      "They'll submit quotes with pricing, experience, and availability",
                      "You review quotes, get AI assessments, and accept the right ones",
                      "Come back here anytime to manage all your events",
                    ].map((t, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-surface-sunken text-ink-muted text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-ink-muted">{t}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push(`/events/${postedEventId}`)}
                    className="btn btn-primary"
                  >
                    View my event →
                  </button>
                  <button
                    onClick={() => {
                      setStep("describe");
                      setIdea("");
                      setBlueprint(null);
                      setChecklist([]);
                      setSelected(new Set());
                      setActiveTab("my-events");
                      setMyEvents(getMyEvents());
                    }}
                    className="btn btn-secondary"
                  >
                    Post another event
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Helper to clear session without importing from store directly in JSX
function clearOrganizerSessionClient() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("eventbridge_organizer_session");
  }
}
