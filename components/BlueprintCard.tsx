"use client";

import { EventBlueprint } from "@/types";

interface Props {
  blueprint: EventBlueprint;
}

const fields = [
  { icon: "🎪", label: "Event Type", key: "eventType" },
  { icon: "📍", label: "Location", key: "location" },
  { icon: "👥", label: "Audience Size", key: "audienceSize" },
  { icon: "⏱️", label: "Duration", key: "duration" },
  { icon: "💰", label: "Estimated Budget", key: "estimatedBudget" },
  { icon: "✨", label: "Vibe", key: "vibe" },
] as const;

export default function BlueprintCard({ blueprint }: Props) {
  return (
    <section className="px-4 py-6 max-w-4xl mx-auto animate-fade-in-up">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="flex items-center gap-2 text-violet-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-semibold uppercase tracking-wider">Event Blueprint</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-violet-500/30 via-violet-500/30 to-transparent" />
      </div>

      <div className="glass-card overflow-hidden">
        {/* Header band */}
        <div className="p-6 md:p-8 border-b border-violet-500/10" style={{background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.05))"}}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">Generated Event Name</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {blueprint.eventName}
              </h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Blueprint Ready</span>
            </div>
          </div>
        </div>

        {/* Fields grid */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {fields.map((field) => (
              <div
                key={field.key}
                className="p-4 rounded-xl bg-black/20 border border-white/5 hover:border-violet-500/20 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{field.icon}</span>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    {field.label}
                  </span>
                </div>
                <p className="text-sm md:text-base text-slate-200 font-medium leading-snug">
                  {blueprint[field.key]}
                </p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="p-5 rounded-xl border border-violet-500/15 bg-violet-500/5">
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-3">Summary</p>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              {blueprint.summary}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
