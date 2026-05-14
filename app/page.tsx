"use client";

import { useState, useCallback } from "react";
import HeroSection from "@/components/HeroSection";
import EventInputForm from "@/components/EventInputForm";
import BlueprintCard from "@/components/BlueprintCard";
import CategoryCard from "@/components/CategoryCard";
import RiskNotes from "@/components/RiskNotes";
import VendorCard from "@/components/VendorCard";
import { EventBlueprint } from "@/types";
import { mockVendors } from "@/data/mockVendors";
import { serviceCategories } from "@/data/serviceCategories";

export default function Home() {
  const [blueprint, setBlueprint] = useState<EventBlueprint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (idea: string) => {
    setIsLoading(true);
    setError(null);
    setBlueprint(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "blueprint", eventIdea: idea }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Something went wrong");
      }

      const data = await res.json();
      setBlueprint(data.blueprint);

      // Scroll to results smoothly
      setTimeout(() => {
        document
          .getElementById("blueprint-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to generate blueprint."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(135deg, #0D0D1A 0%, #100D2E 50%, #0D1520 100%)" }}>
      {/* Hero */}
      <HeroSection />

      {/* Input */}
      <EventInputForm onGenerate={handleGenerate} isLoading={isLoading} />

      {/* Error */}
      {error && (
        <div className="px-4 max-w-4xl mx-auto mb-6">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="px-4 max-w-4xl mx-auto mb-6">
          <div className="glass-card p-8 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold mb-1">Building your event blueprint...</p>
              <p className="text-slate-400 text-sm">AI is structuring your event idea</p>
            </div>
            <div className="w-full max-w-xs space-y-2">
              {[80, 60, 70].map((w, i) => (
                <div key={i} className="h-2 rounded shimmer" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {blueprint && (
        <div id="blueprint-section">
          {/* Blueprint */}
          <BlueprintCard blueprint={blueprint} />

          {/* Event Stack */}
          <CategoryCard categories={serviceCategories} />

          {/* Risks */}
          <RiskNotes risks={blueprint.risks} />

          {/* Vendors */}
          <section className="px-4 py-6 max-w-4xl mx-auto animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
              <div className="flex items-center gap-2 text-pink-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-semibold uppercase tracking-wider">Matched Service Providers</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-pink-500/30 via-pink-500/30 to-transparent" />
            </div>

            <p className="text-slate-400 text-sm mb-6">
              {mockVendors.length} vendors matched based on your event type, location, and vibe. Click any vendor to generate a personalised outreach message.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockVendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} blueprint={blueprint} />
              ))}
            </div>
          </section>

          {/* Footer CTA */}
          <section className="px-4 py-16 max-w-4xl mx-auto text-center">
            <div className="glass-card p-8 md:p-12">
              <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-4">EventOps AI</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                From chaos to clarity in 60 seconds.
              </h2>
              <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
                EventOps AI is the intelligence layer before the marketplace — turning your rough idea into a vendor-ready brief.
              </p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
