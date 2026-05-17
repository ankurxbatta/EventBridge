"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PostedEvent, Quote, ChatMessage } from "@/types";
import {
  getEvent,
  addQuote,
  updateQuoteStatus,
  getOrganizerSession,
  getProviderSession,
} from "@/lib/store";

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
  pending:  { label: "Pending",  cls: "badge-amber" },
  accepted: { label: "Accepted", cls: "badge-green" },
  declined: { label: "Declined", cls: "badge-default" },
};

const CATEGORIES = [
  "Venue","Sound","Lighting","Visuals",
  "Food","Security","Marketing","Artists / Performers",
];

export default function EventDetailPage() {
  const { id }        = useParams<{ id: string }>();
  const router        = useRouter();
  const searchParams  = useSearchParams();

  const [event,        setEvent]        = useState<PostedEvent | null>(null);
  const [viewAs,       setViewAs]       = useState<"organizer" | "provider" | "visitor">("visitor");
  const [providerName, setProviderName] = useState<string | null>(null);
  const [providerCat,  setProviderCat]  = useState<string | null>(null);

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [form,          setForm]          = useState<QuoteFormState>(EMPTY_FORM);
  const [formError,     setFormError]     = useState<string | null>(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [aiReviews,     setAiReviews]     = useState<Record<string, string>>({});
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);

  const [chatOpen,     setChatOpen]     = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput,    setChatInput]    = useState("");
  const [chatLoading,  setChatLoading]  = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ── Load / poll ───────────────────────────────────────────────────────────
  const loadEvent = useCallback(() => {
    const ev = getEvent(id);
    if (!ev) { router.push("/events"); return; }
    setEvent({ ...ev });
  }, [id, router]);

  useEffect(() => {
    const ev = getEvent(id);
    if (!ev) { router.push("/events"); return; }
    setEvent({ ...ev });

    const orgSession  = getOrganizerSession();
    const provSession = getProviderSession();

    // "?role=provider" param lets someone explicitly pick their role
    // when they have both sessions active (e.g. demo mode)
    const roleParam = searchParams?.get("role");

    if (roleParam === "organizer" && orgSession && orgSession.contact === ev.organizerContact) {
      setViewAs("organizer");
    } else if (roleParam === "provider" && provSession) {
      setViewAs("provider");
      setProviderName(provSession.name);
      setProviderCat(provSession.category);
      setForm((f) => ({ ...f, providerName: provSession.name, providerCategory: provSession.category }));
    } else if (orgSession && orgSession.contact === ev.organizerContact && !provSession) {
      // Only org session — definitely organizer
      setViewAs("organizer");
    } else if (provSession && !orgSession) {
      // Only provider session — definitely provider
      setViewAs("provider");
      setProviderName(provSession.name);
      setProviderCat(provSession.category);
      setForm((f) => ({ ...f, providerName: provSession.name, providerCategory: provSession.category }));
    } else if (provSession && orgSession) {
      // Both exist — default to PROVIDER view (they navigated here to quote)
      // unless this is their own event
      if (orgSession.contact === ev.organizerContact) {
        // It's their own event as organizer — show organizer view but offer switch
        setViewAs("organizer");
      } else {
        setViewAs("provider");
        setProviderName(provSession.name);
        setProviderCat(provSession.category);
        setForm((f) => ({ ...f, providerName: provSession.name, providerCategory: provSession.category }));
      }
    } else {
      setViewAs("visitor");
    }

    setChatMessages([{
      role: "assistant",
      content: `I know ${ev.blueprint.eventName} in detail. Ask me anything — budget, logistics, provider fit, or what to prioritise.`,
    }]);
  }, [id, router, searchParams]);

  useEffect(() => {
    const handle = (e: StorageEvent) => { if (e.key === "eventbridge_events") loadEvent(); };
    window.addEventListener("storage", handle);
    return () => window.removeEventListener("storage", handle);
  }, [loadEvent]);

  useEffect(() => {
    const t = setInterval(loadEvent, 3000);
    return () => clearInterval(t);
  }, [loadEvent]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const isOrganizer = viewAs === "organizer";
  const isProvider  = viewAs === "provider";

  const myQuote = event && isProvider && providerName && providerCat
    ? event.quotes.find((q) => q.providerName === providerName && q.providerCategory === providerCat) ?? null
    : null;

  const hasAlreadyQuoted = !!myQuote || submitted;

  const visibleQuotes: Quote[] = !event ? []
    : isOrganizer ? event.quotes
    : isProvider && providerName && providerCat
      ? event.quotes.filter((q) => q.providerName === providerName && q.providerCategory === providerCat)
    : [];

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSubmitQuote = async () => {
    setFormError(null);
    if (!form.providerName.trim())  { setFormError("Please enter your name or company."); return; }
    if (!form.providerCategory)     { setFormError("Please select a service category."); return; }
    if (!form.price.trim())         { setFormError("Please enter your price."); return; }
    if (!form.message.trim())       { setFormError("Please write a message to the organizer."); return; }
    if (!event) return;

    setSubmitting(true);
    try {
      addQuote(event.id, {
        providerId:       `p-${Date.now()}`,
        providerName:     form.providerName.trim(),
        providerCategory: form.providerCategory,
        providerLocation: form.providerLocation,
        price:            form.price.trim(),
        message:          form.message.trim(),
        availability:     form.availability,
        experience:       form.experience,
        portfolioLinks:   form.portfolioLinks
          ? form.portfolioLinks.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      });
      setSubmitted(true);
      setShowQuoteForm(false);
      setForm(EMPTY_FORM);
      loadEvent();
    } catch (err) {
      setFormError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuoteAction = (quoteId: string, status: "accepted" | "declined") => {
    if (!event) return;
    updateQuoteStatus(event.id, quoteId, status);
    loadEvent();
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
      setChatMessages((p) => [...p, { role: "assistant", content: data.reply ?? "" }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-surface-border border-t-ink rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const bp = event.blueprint;

  // Both sessions active on the same event — show a role switcher banner
  const orgSession  = getOrganizerSession();
  const provSession = getProviderSession();
  const hasBothSessions = !!orgSession && !!provSession;

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to events
        </Link>

        {/* Role switcher — shown when both sessions exist */}
        {hasBothSessions && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 mb-5 bg-surface-sunken rounded-xl border border-surface-border">
            <p className="text-xs text-ink-muted">Viewing as:</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (orgSession && orgSession.contact === event.organizerContact) {
                    setViewAs("organizer");
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isOrganizer
                    ? "bg-ink text-white border-ink"
                    : "bg-white text-ink-muted border-surface-border hover:border-ink/20"
                }`}
              >
                🎪 Organizer
              </button>
              <button
                onClick={() => {
                  if (provSession) {
                    setViewAs("provider");
                    setProviderName(provSession.name);
                    setProviderCat(provSession.category);
                    setForm((f) => ({ ...f, providerName: provSession.name, providerCategory: provSession.category }));
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isProvider
                    ? "bg-ink text-white border-ink"
                    : "bg-white text-ink-muted border-surface-border hover:border-ink/20"
                }`}
              >
                🎤 Provider
              </button>
            </div>
          </div>
        )}

        {/* Identity banners */}
        {isOrganizer && !hasBothSessions && (
          <div className="flex items-center gap-2.5 px-4 py-3 mb-6 bg-surface-sunken rounded-xl border border-surface-border text-sm">
            <svg className="w-4 h-4 text-accent-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-ink font-medium">You're the organizer</span>
            <span className="text-ink-muted">— you can review and act on quotes</span>
            {event.quotes.filter((q) => q.status === "pending").length > 0 && (
              <span className="ml-auto badge badge-amber">
                {event.quotes.filter((q) => q.status === "pending").length} pending
              </span>
            )}
          </div>
        )}

        {isProvider && !hasBothSessions && (
          <div className="flex items-center gap-2.5 px-4 py-3 mb-6 bg-surface-sunken rounded-xl border border-surface-border text-sm">
            <svg className="w-4 h-4 text-accent-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-ink font-medium">Viewing as provider</span>
            {hasAlreadyQuoted && myQuote && (
              <span className={`ml-auto badge ${STATUS_CONFIG[myQuote.status].cls}`}>
                Quote {STATUS_CONFIG[myQuote.status].label}
              </span>
            )}
          </div>
        )}

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
          {!isOrganizer && !hasAlreadyQuoted && event.status !== "closed" && (
            <button onClick={() => { setFormError(null); setShowQuoteForm(true); }} className="btn btn-primary flex-shrink-0">
              Submit a quote
            </button>
          )}
          {isProvider && hasAlreadyQuoted && (
            <div className="text-xs text-ink-muted flex-shrink-0 text-right">
              Quote submitted ✓<br /><span className="text-ink-faint">Waiting for organizer review</span>
            </div>
          )}
        </div>

        {submitted && (
          <div className="card p-4 mb-6 border-accent-green/30 bg-green-50 flex items-center gap-3">
            <svg className="w-5 h-5 text-accent-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-accent-green font-medium">Quote submitted! The organizer will review it shortly.</p>
          </div>
        )}

        {/* Blueprint */}
        <div className="card p-6 mb-5">
          <p className="section-label mb-4">Event brief</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            {[
              { label: "Type",     value: bp.eventType },
              { label: "Location", value: bp.location },
              { label: "Audience", value: bp.audienceSize },
              { label: "Duration", value: bp.duration },
              { label: "Budget",   value: bp.estimatedBudget },
              { label: "Vibe",     value: bp.vibe },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-xs text-ink-faint mb-0.5">{f.label}</p>
                <p className="text-sm font-medium text-ink">{f.value}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-ink-muted leading-relaxed border-t border-surface-border pt-4">{bp.summary}</p>
        </div>

        {/* Services */}
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
          <button onClick={() => setChatOpen((p) => !p)} className="w-full flex items-center justify-between p-5 hover:bg-surface-hover transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center text-sm">⚡</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-ink">Ask AI about this event</p>
                <p className="text-xs text-ink-muted">Budget, logistics, provider fit questions</p>
              </div>
            </div>
            <svg className={`w-4 h-4 text-ink-faint transition-transform ${chatOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {chatOpen && (
            <div className="border-t border-surface-border">
              <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                    {m.role === "assistant" && <div className="w-6 h-6 rounded-full bg-surface-sunken text-xs flex items-center justify-center flex-shrink-0">⚡</div>}
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-ink text-white rounded-tr-sm" : "bg-surface-sunken text-ink-soft rounded-tl-sm"}`}>
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
                <input className="input text-sm" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendChat(chatInput); }} placeholder="Ask anything about this event…" />
                <button onClick={() => sendChat(chatInput)} disabled={!chatInput.trim() || chatLoading} className="btn btn-primary btn-sm flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quotes */}
        <div className="mb-10">
          <p className="section-label mb-4">
            {isOrganizer ? `All quotes (${event.quotes.length})` : isProvider && hasAlreadyQuoted ? "Your quote" : "Quotes"}
          </p>

          {!isOrganizer && !isProvider && (
            <div className="card p-10 text-center">
              <p className="text-ink-muted text-sm mb-3">Interested in this event? Submit a quote.</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button onClick={() => { setFormError(null); setShowQuoteForm(true); }} className="btn btn-primary btn-sm">Submit a quote</button>
                <Link href="/provider" className="btn btn-secondary btn-sm">Build a provider profile first</Link>
              </div>
            </div>
          )}

          {isProvider && !hasAlreadyQuoted && (
            <div className="card p-10 text-center">
              <p className="text-ink-muted text-sm mb-3">You haven't quoted on this event yet.</p>
              <button onClick={() => { setFormError(null); setShowQuoteForm(true); }} className="btn btn-primary btn-sm">Submit your quote</button>
            </div>
          )}

          {visibleQuotes.length > 0 && (
            <div className="space-y-4">
              {visibleQuotes.map((quote) => {
                const sc = STATUS_CONFIG[quote.status];
                return (
                  <div key={quote.id} className={`card p-5 transition-all ${quote.status === "accepted" ? "border-accent-green/30 bg-green-50/30" : ""}`}>
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
                      <p className="text-xs text-ink-faint mb-3 flex items-center gap-1.5">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                        {quote.experience}
                      </p>
                    )}
                    {isOrganizer && (
                      aiReviews[quote.id]
                        ? <div className="bg-surface-sunken rounded-lg p-3 mb-3 text-xs text-ink-muted italic border border-surface-border">⚡ {aiReviews[quote.id]}</div>
                        : <button onClick={() => handleAiReview(quote)} disabled={reviewLoading === quote.id} className="btn btn-ghost btn-sm text-ink-muted mb-3">
                            {reviewLoading === quote.id ? <><span className="w-3 h-3 border border-ink-faint border-t-ink rounded-full animate-spin inline-block" /> Reviewing…</> : "⚡ AI review this quote"}
                          </button>
                    )}
                    {isOrganizer && quote.status === "pending" && (
                      <div className="flex gap-2 pt-2 border-t border-surface-border">
                        <button onClick={() => handleQuoteAction(quote.id, "accepted")} className="btn btn-primary btn-sm">Accept</button>
                        <button onClick={() => handleQuoteAction(quote.id, "declined")} className="btn btn-secondary btn-sm">Decline</button>
                      </div>
                    )}
                    {isProvider && quote.status === "accepted" && (
                      <div className="pt-2 border-t border-surface-border">
                        <p className="text-sm text-accent-green font-medium">🎉 Your quote was accepted! The organizer will be in touch.</p>
                      </div>
                    )}
                    {isProvider && quote.status === "declined" && (
                      <div className="pt-2 border-t border-surface-border">
                        <p className="text-sm text-ink-muted">Not selected this time. Browse other open events.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Quote modal */}
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
                    <option value="">Select a category…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
                <textarea className="input" rows={4} placeholder="Tell the organizer about your experience and why you're a great fit…" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Availability</label>
                  <input className="input" value={form.availability} onChange={(e) => setForm((p) => ({ ...p, availability: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Experience</label>
                  <input className="input" placeholder="8 years, 200+ events" value={form.experience} onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Portfolio links (comma-separated)</label>
                <input className="input" placeholder="instagram.com/…, soundcloud.com/…" value={form.portfolioLinks} onChange={(e) => setForm((p) => ({ ...p, portfolioLinks: e.target.value }))} />
              </div>
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-accent-red">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {formError}
                </div>
              )}
              <button onClick={handleSubmitQuote} disabled={submitting} className="btn btn-primary w-full justify-center btn-lg">
                {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />Submitting…</> : "Submit quote →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
