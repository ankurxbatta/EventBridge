"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PostedEvent, Quote, ChatMessage } from "@/types";
import { getEvent, addQuote, updateQuoteStatus, getEvents } from "@/lib/store";

// ── Quote form ─────────────────────────────────────────────────────────────────
interface QuoteFormState {
  providerName: string;
  providerCategory: string;
  providerLocation: string;
  price: string;
  message: string;
  availability: string;
  experience: string;
  portfolioLinks: string;
}

const EMPTY_FORM: QuoteFormState = {
  providerName: "", providerCategory: "", providerLocation: "Vancouver, BC",
  price: "", message: "", availability: "Available", experience: "", portfolioLinks: "",
};

const STATUS_CONFIG = {
  pending: { label: "Pending", cls: "badge-amber" },
  accepted: { label: "Accepted", cls: "badge-green" },
  declined: { label: "Declined", cls: "badge-default" },
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<PostedEvent | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [form, setForm] = useState<QuoteFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiReviews, setAiReviews] = useState<Record<string, string>>({});
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ev = getEvent(id);
    if (!ev) { router.push("/events"); return; }
    setEvent(ev);
    // Init chat greeting
    setChatMessages([{
      role: "assistant",
      content: `I know ${ev.blueprint.eventName} in detail. Ask me anything — budget questions, provider fit, logistics, or what to prioritise.`,
    }]);
  }, [id, router]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const refresh = () => {
    const ev = getEvent(id);
    if (ev) setEvent(ev);
  };

  const handleSubmitQuote = async () => {
    if (!event || !form.providerName || !form.price || !form.message) return;
    setSubmitting(true);
    try {
      addQuote(event.id, {
        providerId: `p-${Date.now()}`,
        providerName: form.providerName,
        providerCategory: form.providerCategory,
        providerLocation: form.providerLocation,
        price: form.price,
        message: form.message,
        availability: form.availability,
        experience: form.experience,
        portfolioLinks: form.portfolioLinks ? form.portfolioLinks.split(",").map((s) => s.trim()) : [],
      });
      setSubmitted(true);
      setShowQuoteForm(false);
      setForm(EMPTY_FORM);
      refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuoteAction = (quoteId: string, status: "accepted" | "declined") => {
    if (!event) return;
    updateQuoteStatus(event.id, quoteId, status);
    refresh();
  };

  const handleAiReview = async (quote: Quote) => {
    if (!event || aiReviews[quote.id]) return;
    setReviewLoading(quote.id);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "quote-review", blueprint: event.blueprint, quote }),
      });
      const data = await res.json();
      setAiReviews((p) => ({ ...p, [quote.id]: data.review ?? "" }));
    } finally {
      setReviewLoading(null);
    }
  };

  const sendChat = async (text: string) => {
    if (!text.trim() || chatLoading || !event) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    setChatMessages((p) => [...p, userMsg]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "chat", blueprint: event.blueprint, messages: [...chatMessages, userMsg] }),
      });
      const data = await res.json();
      setChatMessages((p) => [...p, { role: "assistant", content: data.reply ?? "I couldn't answer that." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="w-8 h-8 border-2 border-surface-border border-t-ink rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const bp = event.blueprint;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Back */}
        <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to events
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge ${event.status === "open" ? "badge-green" : event.status === "in-progress" ? "badge-amber" : "badge-default"}`}>
                {event.status === "open" ? "Open for quotes" : event.status === "in-progress" ? "In progress" : "Closed"}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-ink">{bp.eventName}</h1>
            <p className="text-ink-muted text-sm mt-1">by {event.organizerName}</p>
          </div>
          {event.status !== "closed" && (
            <button onClick={() => setShowQuoteForm(true)} className="btn btn-primary flex-shrink-0">
              Submit a quote
            </button>
          )}
        </div>

        {/* Success banner */}
        {submitted && (
          <div className="card p-4 mb-6 border-accent-green/30 bg-green-50 flex items-center gap-3">
            <svg className="w-5 h-5 text-accent-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <p className="text-sm text-accent-green font-medium">Quote submitted successfully! The organizer will be in touch.</p>
          </div>
        )}

        {/* Blueprint */}
        <div className="card p-6 mb-5">
          <p className="section-label mb-4">Event brief</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            {[
              { label: "Type", value: bp.eventType },
              { label: "Location", value: bp.location },
              { label: "Audience", value: bp.audienceSize },
              { label: "Duration", value: bp.duration },
              { label: "Budget", value: bp.estimatedBudget },
              { label: "Vibe", value: bp.vibe },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-xs text-ink-faint mb-0.5">{f.label}</p>
                <p className="text-sm font-medium text-ink">{f.value}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-ink-muted leading-relaxed border-t border-surface-border pt-4">{bp.summary}</p>
        </div>

        {/* Services needed */}
        <div className="card p-5 mb-5">
          <p className="section-label mb-3">Services needed</p>
          <div className="flex flex-wrap gap-2">
            {event.selectedServices.map((s) => <span key={s} className="badge badge-ink">{s}</span>)}
          </div>
        </div>

        {/* Risks */}
        {bp.risks?.length > 0 && (
          <div className="card p-5 mb-5">
            <p className="section-label mb-3">Operational notes</p>
            <ul className="space-y-2">
              {bp.risks.map((r, i) => (
                <li key={i} className="flex gap-3 text-sm text-ink-muted">
                  <span className="w-4 h-4 rounded-full bg-surface-sunken text-ink-faint text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Chat */}
        <div className="card mb-5 overflow-hidden">
          <button
            onClick={() => setChatOpen((p) => !p)}
            className="w-full flex items-center justify-between p-5 hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center text-sm">⚡</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-ink">Ask AI about this event</p>
                <p className="text-xs text-ink-muted">Budget, logistics, provider fit questions</p>
              </div>
            </div>
            <svg className={`w-4 h-4 text-ink-faint transition-transform ${chatOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>

          {chatOpen && (
            <div className="border-t border-surface-border">
              <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                    {m.role === "assistant" && <div className="w-6 h-6 rounded-full bg-surface-sunken text-xs flex items-center justify-center flex-shrink-0">⚡</div>}
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user" ? "bg-ink text-white rounded-tr-sm" : "bg-surface-sunken text-ink-soft rounded-tl-sm"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-sunken text-xs flex items-center justify-center">⚡</div>
                    <div className="bg-surface-sunken rounded-xl rounded-tl-sm px-3 py-2 flex gap-1">
                      {[0,1,2].map((i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
              <div className="p-4 border-t border-surface-border flex gap-2">
                <input
                  className="input text-sm"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendChat(chatInput); }}
                  placeholder="Ask anything about this event…"
                />
                <button onClick={() => sendChat(chatInput)} disabled={!chatInput.trim() || chatLoading} className="btn btn-primary btn-sm flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quotes */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <p className="section-label">Quotes ({event.quotes.length})</p>
          </div>

          {event.quotes.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-ink-muted text-sm">No quotes yet.</p>
              <button onClick={() => setShowQuoteForm(true)} className="btn btn-primary btn-sm mt-3">Be the first to quote</button>
            </div>
          ) : (
            <div className="space-y-4">
              {event.quotes.map((quote) => {
                const sc = STATUS_CONFIG[quote.status];
                return (
                  <div key={quote.id} className={`card p-5 ${quote.status === "accepted" ? "border-accent-green/30 bg-green-50/30" : ""}`}>
                    <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-ink">{quote.providerName}</h3>
                          <span className={`badge ${sc.cls}`}>{sc.label}</span>
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">{quote.providerCategory} · {quote.providerLocation}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-ink">{quote.price}</p>
                        <p className="text-xs text-ink-faint">{quote.availability}</p>
                      </div>
                    </div>

                    <p className="text-sm text-ink-muted leading-relaxed mb-3">{quote.message}</p>

                    {quote.experience && (
                      <p className="text-xs text-ink-faint mb-3 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                        {quote.experience}
                      </p>
                    )}

                    {/* AI review */}
                    {aiReviews[quote.id] ? (
                      <div className="bg-surface-sunken rounded-lg p-3 mb-3 text-xs text-ink-muted italic border border-surface-border">
                        ⚡ {aiReviews[quote.id]}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAiReview(quote)}
                        disabled={reviewLoading === quote.id}
                        className="btn btn-ghost btn-sm text-ink-muted mb-3"
                      >
                        {reviewLoading === quote.id ? (
                          <><span className="w-3 h-3 border border-ink-faint border-t-ink rounded-full animate-spin inline-block" />Reviewing…</>
                        ) : "⚡ AI review this quote"}
                      </button>
                    )}

                    {/* Actions */}
                    {quote.status === "pending" && (
                      <div className="flex gap-2 pt-2 border-t border-surface-border">
                        <button onClick={() => handleQuoteAction(quote.id, "accepted")} className="btn btn-primary btn-sm">Accept</button>
                        <button onClick={() => handleQuoteAction(quote.id, "declined")} className="btn btn-secondary btn-sm">Decline</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Quote submission modal */}
      {showQuoteForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowQuoteForm(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" style={{ boxShadow: "0 20px 60px -10px rgba(0,0,0,0.15)" }}>
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <div>
                <h2 className="font-bold text-ink">Submit a quote</h2>
                <p className="text-xs text-ink-muted mt-0.5">for {bp.eventName}</p>
              </div>
              <button onClick={() => setShowQuoteForm(false)} className="btn btn-ghost btn-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Your name / company *</label>
                  <input className="input" placeholder="Bassline Audio" value={form.providerName} onChange={(e) => setForm((p) => ({ ...p, providerName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Service category *</label>
                  <select className="input" value={form.providerCategory} onChange={(e) => setForm((p) => ({ ...p, providerCategory: e.target.value }))}>
                    <option value="">Select…</option>
                    {["Venue", "Sound", "Lighting", "Visuals", "Food", "Security", "Marketing", "Artists / Performers"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Location</label>
                  <input className="input" value={form.providerLocation} onChange={(e) => setForm((p) => ({ ...p, providerLocation: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Your price *</label>
                  <input className="input" placeholder="$1,500" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Your message *</label>
                <textarea className="input" rows={4} placeholder="Tell the organizer about your experience with this type of event and why you're a great fit…" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Availability</label>
                  <input className="input" value={form.availability} onChange={(e) => setForm((p) => ({ ...p, availability: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Experience summary</label>
                  <input className="input" placeholder="8 years, 200+ events" value={form.experience} onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Portfolio links (comma-separated)</label>
                <input className="input" placeholder="instagram.com/…, soundcloud.com/…" value={form.portfolioLinks} onChange={(e) => setForm((p) => ({ ...p, portfolioLinks: e.target.value }))} />
              </div>
              <button
                onClick={handleSubmitQuote}
                disabled={!form.providerName || !form.price || !form.message || submitting}
                className="btn btn-primary w-full justify-center btn-lg"
              >
                {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />Submitting…</> : "Submit quote →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
