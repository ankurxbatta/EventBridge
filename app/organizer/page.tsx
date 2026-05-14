"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { EventBlueprint, ChecklistItem } from "@/types";
import { saveEvent } from "@/lib/store";

// ── Step indicator ─────────────────────────────────────────────────────────────
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

// ── Budget helpers ─────────────────────────────────────────────────────────────
function parseBudget(raw: string): number {
  return parseInt(raw.replace(/[^0-9]/g, "")) || 5000;
}

function buildDefaultAllocation(services: string[], total: number): Record<string, number> {
  if (!services.length) return {};
  const each = Math.floor(total / services.length);
  return Object.fromEntries(services.map((s) => [s, each]));
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function OrganizerPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("describe");

  // Step 1
  const [idea, setIdea] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerContact, setOrganizerContact] = useState("");

  // Step 2
  const [blueprint, setBlueprint] = useState<EventBlueprint | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingBlueprint, setLoadingBlueprint] = useState(false);

  // Step 3
  const [budgetAllocation, setBudgetAllocation] = useState<Record<string, number>>({});
  const [postedEventId, setPostedEventId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1 → 2 ──────────────────────────────────────────────────────────────
  const handleDescribeSubmit = useCallback(async () => {
    if (!idea.trim() || !organizerName.trim()) return;
    setLoadingBlueprint(true);
    setError(null);
    try {
      // Generate blueprint
      const bpRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "blueprint", eventIdea: idea }),
      });
      const bpData = await bpRes.json();
      const bp: EventBlueprint = bpData.blueprint;
      setBlueprint(bp);

      // Generate checklist from blueprint
      const clRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "checklist", blueprint: bp }),
      });
      const clData = await clRes.json();
      const items: ChecklistItem[] = clData.checklist ?? [];
      setChecklist(items);

      // Pre-select must-haves
      const mustHave = new Set(items.filter((i) => i.priority === "must-have").map((i) => i.service));
      setSelected(mustHave);

      setStep("checklist");
    } catch {
      setError("Failed to generate. Please try again.");
    } finally {
      setLoadingBlueprint(false);
    }
  }, [idea, organizerName]);

  // ── Step 2 → 3 ──────────────────────────────────────────────────────────────
  const handleChecklistNext = () => {
    if (!blueprint || selected.size === 0) return;
    const services = Array.from(selected);
    const total = parseBudget(blueprint.estimatedBudget);
    setBudgetAllocation(buildDefaultAllocation(services, total));
    setStep("review");
  };

  // ── Step 3 → 4 ──────────────────────────────────────────────────────────────
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
      setPostedEventId(event.id);
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
        {/* Progress */}
        {step !== "posted" && (
          <div className="mb-10">
            <div className="flex items-center gap-0">
              {STEPS.filter((s) => s.id !== "posted").map((s, i) => {
                const active = s.id === step;
                const done = STEPS.findIndex((x) => x.id === step) > i;
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
                    {i < 2 && <div className={`h-px flex-1 mx-3 ${done ? "bg-ink-muted" : "bg-surface-border"}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 1: Describe ──────────────────────────────────────────── */}
        {step === "describe" && (
          <div className="animate-slide-up">
            <h1 className="text-2xl font-extrabold text-ink mb-1">Describe your event</h1>
            <p className="text-ink-muted text-sm mb-8">A few sentences is enough. AI handles the rest.</p>

            <div className="space-y-5">
              <div>
                <label className="label">Your name</label>
                <input className="input" placeholder="e.g. Maya Chen" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} />
              </div>

              <div>
                <label className="label">Contact email</label>
                <input className="input" type="email" placeholder="you@email.com" value={organizerContact} onChange={(e) => setOrganizerContact(e.target.value)} />
              </div>

              <div>
                <label className="label">Tell us about your event</label>
                <textarea
                  className="input"
                  rows={6}
                  placeholder={"Example: I want to host a one-night underground music and art event in Vancouver for around 150 people. I need sound, lights, visuals, and security. The vibe should feel immersive and community-focused. Budget is around $8,000."}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                />
                <p className="text-xs text-ink-faint mt-1.5">Include: type, location, size, vibe, budget. More detail = better checklist.</p>
              </div>

              {error && <p className="text-sm text-accent-red">{error}</p>}

              <button
                onClick={handleDescribeSubmit}
                disabled={!idea.trim() || !organizerName.trim() || loadingBlueprint}
                className="btn btn-primary btn-lg w-full justify-center"
              >
                {loadingBlueprint ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    Building checklist…
                  </>
                ) : (
                  <>Generate checklist <span className="opacity-60">→</span></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Checklist ─────────────────────────────────────────── */}
        {step === "checklist" && blueprint && (
          <div className="animate-slide-up">
            <div className="mb-6">
              <p className="section-label mb-1">AI-generated checklist</p>
              <h1 className="text-2xl font-extrabold text-ink">{blueprint.eventName}</h1>
              <p className="text-ink-muted text-sm mt-1">{blueprint.eventType} · {blueprint.location} · {blueprint.audienceSize}</p>
            </div>

            <p className="text-sm text-ink-muted mb-4">Select the services you need help with. Must-haves are pre-selected.</p>

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
                        <span className={`text-sm font-semibold ${isSelected ? "text-white" : "text-ink"}`}>{item.service}</span>
                        <span className={`badge ${isSelected ? "bg-white/20 text-white border-white/20" : pc.cls} text-xs`}>{pc.label}</span>
                      </div>
                      <p className={`text-xs leading-relaxed ${isSelected ? "text-white/70" : "text-ink-muted"}`}>{item.reason}</p>
                      <p className={`text-xs font-medium mt-1.5 ${isSelected ? "text-white/60" : "text-ink-faint"}`}>Est. {item.estimatedCost}</p>
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

            <p className="text-xs text-ink-faint mb-4">{selected.size} service{selected.size !== 1 ? "s" : ""} selected</p>

            <div className="flex gap-3">
              <button onClick={() => setStep("describe")} className="btn btn-secondary">Back</button>
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

        {/* ── Step 3: Review ────────────────────────────────────────────── */}
        {step === "review" && blueprint && (
          <div className="animate-slide-up">
            <h1 className="text-2xl font-extrabold text-ink mb-1">Review & post</h1>
            <p className="text-ink-muted text-sm mb-8">This is what providers will see when they browse open events.</p>

            {/* Blueprint summary */}
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
              <p className="text-sm text-ink-muted leading-relaxed">{blueprint.summary}</p>
            </div>

            {/* Services needed */}
            <div className="card p-5 mb-5">
              <p className="section-label mb-3">Services needed ({selected.size})</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selected).map((s) => (
                  <span key={s} className="badge badge-default">{s}</span>
                ))}
              </div>
            </div>

            {/* Budget allocation */}
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
                        onChange={(e) => setBudgetAllocation((p) => ({ ...p, [cat]: parseInt(e.target.value) || 0 }))}
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
              <button onClick={() => setStep("checklist")} className="btn btn-secondary">Back</button>
              <button
                onClick={handlePost}
                disabled={posting}
                className="btn btn-primary flex-1 justify-center"
              >
                {posting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />Posting…</>
                ) : "Post event →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Posted ────────────────────────────────────────────── */}
        {step === "posted" && postedEventId && blueprint && (
          <div className="animate-slide-up text-center py-8">
            <div className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-ink mb-2">{blueprint.eventName} is live</h1>
            <p className="text-ink-muted mb-8 text-sm">Your event brief is posted and open for provider quotes.</p>

            <div className="card p-5 text-left mb-6">
              <p className="section-label mb-3">What happens next</p>
              <div className="space-y-3">
                {[
                  "Providers in your area will see your event brief",
                  "They'll submit quotes with pricing, experience, and availability",
                  "You review quotes, chat with the AI about fit, and shortlist",
                  "Accept the right providers and export your full event brief",
                ].map((t, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-surface-sunken text-ink-muted text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-ink-muted">{t}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => router.push(`/events/${postedEventId}`)} className="btn btn-primary">
                View my event →
              </button>
              <button onClick={() => router.push("/events")} className="btn btn-secondary">
                Browse all events
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
