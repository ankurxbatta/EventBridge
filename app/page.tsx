"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

const HOW_IT_WORKS_ORGANIZER = [
  { step: "01", title: "Describe your event", body: "Write a few sentences about your event idea — vibe, size, budget, location." },
  { step: "02", title: "AI builds your checklist", body: "Get a smart checklist of exactly what services you need, prioritised by importance." },
  { step: "03", title: "Post and receive quotes", body: "Publish your event brief. Qualified providers send you quotes directly." },
  { step: "04", title: "Co-create with confidence", body: "Review providers, track outreach, allocate budget, and export your brief." },
];

const HOW_IT_WORKS_PROVIDER = [
  { step: "01", title: "Build your profile", body: "Set your service category, experience, price range, and what events you love working." },
  { step: "02", title: "Browse open events", body: "See event briefs from organizers who need exactly what you offer." },
  { step: "03", title: "Submit a quote", body: "Write a personalised proposal with your price and availability." },
  { step: "04", title: "Grow your portfolio", body: "Build lineage and community trust through every event you work." },
];

const STATS = [
  { value: "60s", label: "From idea to brief" },
  { value: "2-sided", label: "Organizers + Providers" },
  { value: "AI-first", label: "Not just a marketplace" },
  { value: "Community", label: "Built for the scene" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-surface-border bg-surface-raised text-ink-muted text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
          Built for underground and community events
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-ink tracking-tight leading-[1.05] mb-6">
          From messy idea<br />
          <span className="text-ink-muted">to vendor-ready plan.</span>
        </h1>

        <p className="text-lg text-ink-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          EventBridge is the intelligence layer before the marketplace. Describe your event,
          get a smart checklist, match with providers, and co-create the experience — in 60 seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Link href="/organizer" className="btn btn-primary btn-lg w-full sm:w-auto">
            Plan my event
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link href="/provider" className="btn btn-secondary btn-lg w-full sm:w-auto">
            Join as a provider
          </Link>
          <Link href="/events" className="btn btn-ghost btn-lg w-full sm:w-auto text-ink-muted">
            Browse open events →
          </Link>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {STATS.map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-2xl font-extrabold text-ink mb-1">{s.value}</div>
              <div className="text-xs text-ink-faint font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* Two-sided value props */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Organizer */}
          <div className="card p-8">
            <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">For organizers</h2>
            <p className="text-ink-muted text-sm mb-6 leading-relaxed">
              Stop guessing what you need. AI turns your rough event idea into a structured brief, budget breakdown, and matched provider shortlist.
            </p>
            <div className="space-y-4 mb-6">
              {HOW_IT_WORKS_ORGANIZER.map((item) => (
                <div key={item.step} className="flex gap-4">
                  <span className="text-xs font-bold text-ink-faint mt-0.5 w-5 flex-shrink-0">{item.step}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/organizer" className="btn btn-primary w-full justify-center">
              Start planning
            </Link>
          </div>

          {/* Provider */}
          <div className="card p-8">
            <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">For providers</h2>
            <p className="text-ink-muted text-sm mb-6 leading-relaxed">
              You're already being matched to events. Claim your profile, browse events that fit your specialty, and submit quotes directly.
            </p>
            <div className="space-y-4 mb-6">
              {HOW_IT_WORKS_PROVIDER.map((item) => (
                <div key={item.step} className="flex gap-4">
                  <span className="text-xs font-bold text-ink-faint mt-0.5 w-5 flex-shrink-0">{item.step}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/provider" className="btn btn-primary w-full justify-center">
              Build my profile
            </Link>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Positioning statement */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="section-label mb-4">Our positioning</p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-ink mb-6 leading-tight">
          We're not building another marketplace.<br />
          <span className="text-ink-muted">We're building the missing intelligence layer.</span>
        </h2>
        <p className="text-ink-muted leading-relaxed max-w-xl mx-auto mb-8">
          The hard part isn't finding vendors. It's turning a chaotic event idea into a clear operational brief that vendors can actually respond to. That's what EventBridge does — and no one else does it for the underground and community scene.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {["Underground music", "Community festivals", "Art events", "Pop-up markets", "Corporate offsites", "Warehouse parties"].map((tag) => (
            <span key={tag} className="badge badge-default">{tag}</span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface-raised">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-ink flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-ink">EventBridge</span>
          </div>
          <p className="text-xs text-ink-faint text-center">
            Built for the underground and community scene · Hackathon 2026
          </p>
          <div className="flex gap-4 text-xs text-ink-muted">
            <Link href="/organizer" className="hover:text-ink transition-colors">Plan Event</Link>
            <Link href="/provider" className="hover:text-ink transition-colors">Providers</Link>
            <Link href="/events" className="hover:text-ink transition-colors">Events</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
