"use client";

interface Props {
  risks: string[];
}

export default function RiskNotes({ risks }: Props) {
  return (
    <section className="px-4 py-6 max-w-4xl mx-auto animate-fade-in-up">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
        <div className="flex items-center gap-2 text-orange-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm font-semibold uppercase tracking-wider">Operational Risks</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-orange-500/30 via-orange-500/30 to-transparent" />
      </div>

      <div className="glass-card p-6 border-orange-500/15">
        <p className="text-xs text-slate-500 mb-5">
          These risk factors were identified based on your event type, scale, and requirements. Review before confirming vendors.
        </p>
        <div className="space-y-3">
          {risks.map((risk, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 hover:border-orange-500/20 transition-colors"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center mt-0.5">
                <span className="text-orange-400 text-xs font-bold">{i + 1}</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{risk}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
