"use client";

import { ServiceCategoryItem, ServicePriority } from "@/types";

interface Props {
  categories: ServiceCategoryItem[];
}

const priorityConfig: Record<ServicePriority, { badge: string; dot: string; order: number }> = {
  "Must-have": { badge: "badge-must-have", dot: "bg-red-400", order: 0 },
  Important: { badge: "badge-important", dot: "bg-yellow-400", order: 1 },
  Optional: { badge: "badge-optional", dot: "bg-green-400", order: 2 },
};

const categoryIcons: Record<string, string> = {
  Venue: "🏛️",
  Sound: "🔊",
  Lighting: "💡",
  Visuals: "🎨",
  Food: "🍔",
  Security: "🛡️",
  Marketing: "📣",
  "Artists / Performers": "🎤",
};

export default function CategoryCard({ categories }: Props) {
  const sorted = [...categories].sort(
    (a, b) =>
      priorityConfig[a.priority].order - priorityConfig[b.priority].order
  );

  return (
    <section className="px-4 py-6 max-w-4xl mx-auto animate-fade-in-up">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <div className="flex items-center gap-2 text-cyan-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-sm font-semibold uppercase tracking-wider">Recommended Event Stack</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 via-cyan-500/30 to-transparent" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((cat, i) => {
          const config = priorityConfig[cat.priority];
          return (
            <div
              key={cat.name}
              className="glass-card p-5 hover:border-violet-500/25 transition-all group"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{categoryIcons[cat.name] ?? "🔧"}</span>
                  <h3 className="text-white font-semibold text-sm md:text-base">{cat.name}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config.badge}`}>
                  {cat.priority}
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{cat.reason}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
