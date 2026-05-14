"use client";

import { useState, useEffect, useCallback } from "react";
import { EventBlueprint, BudgetLine } from "@/types";

interface Props {
  blueprint: EventBlueprint;
}

const CATEGORY_META: Record<string, { icon: string; color: string; defaultPct: number }> = {
  Venue:                { icon: "🏛️", color: "#8B5CF6", defaultPct: 30 },
  Sound:                { icon: "🔊", color: "#06B6D4", defaultPct: 22 },
  Lighting:             { icon: "💡", color: "#F59E0B", defaultPct: 12 },
  Visuals:              { icon: "🎨", color: "#EC4899", defaultPct: 10 },
  Security:             { icon: "🛡️", color: "#EF4444", defaultPct: 10 },
  "Artists / Performers": { icon: "🎤", color: "#10B981", defaultPct: 8 },
  Marketing:            { icon: "📣", color: "#3B82F6", defaultPct: 5 },
  Food:                 { icon: "🍔", color: "#F97316", defaultPct: 3 },
};

const FALLBACK = { icon: "🔧", color: "#6B7280", defaultPct: 5 };

function parseBudget(raw: string): number {
  const match = raw.replace(/,/g, "").match(/\d+/);
  return match ? parseInt(match[0], 10) : 5000;
}

function normalize(lines: BudgetLine[]): BudgetLine[] {
  const total = lines.reduce((s, l) => s + l.percentage, 0);
  if (total === 0) return lines;
  return lines.map((l) => ({ ...l, percentage: Math.round((l.percentage / total) * 100) }));
}

export default function BudgetAllocator({ blueprint }: Props) {
  const totalBudget = parseBudget(blueprint.estimatedBudget);

  const buildLines = useCallback((): BudgetLine[] => {
    const services = blueprint.requiredServices.length
      ? blueprint.requiredServices
      : Object.keys(CATEGORY_META);

    const raw: BudgetLine[] = services.map((cat) => {
      const meta = CATEGORY_META[cat] ?? FALLBACK;
      return {
        category: cat,
        percentage: meta.defaultPct,
        amount: 0,
        icon: meta.icon,
      };
    });

    const normalised = normalize(raw);
    return normalised.map((l) => ({
      ...l,
      amount: Math.round((l.percentage / 100) * totalBudget),
    }));
  }, [blueprint.requiredServices, totalBudget]);

  const [lines, setLines] = useState<BudgetLine[]>(buildLines);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    setLines(buildLines());
  }, [buildLines]);

  const updateLine = (category: string, newPct: number) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.category === category);
      if (idx === -1) return prev;
      const clamped = Math.max(1, Math.min(80, newPct));
      const diff = clamped - prev[idx].percentage;
      const others = prev.filter((_, i) => i !== idx);
      const totalOthers = others.reduce((s, l) => s + l.percentage, 0);

      const updated = prev.map((l, i) => {
        if (i === idx) return { ...l, percentage: clamped, amount: Math.round((clamped / 100) * totalBudget) };
        const share = totalOthers > 0 ? l.percentage / totalOthers : 1 / others.length;
        const adjusted = Math.max(1, Math.round(l.percentage - diff * share));
        return { ...l, percentage: adjusted, amount: Math.round((adjusted / 100) * totalBudget) };
      });

      // Fix rounding so total = 100
      const sum = updated.reduce((s, l) => s + l.percentage, 0);
      if (sum !== 100) updated[updated.length - 1].percentage += 100 - sum;
      return updated.map((l) => ({ ...l, amount: Math.round((l.percentage / 100) * totalBudget) }));
    });
  };

  const spent = lines.reduce((s, l) => s + l.amount, 0);
  const remaining = totalBudget - spent;

  return (
    <section className="px-4 py-6 max-w-4xl mx-auto animate-fade-in-up">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <div className="flex items-center gap-2 text-emerald-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-semibold uppercase tracking-wider">Budget Allocator</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/30 via-emerald-500/30 to-transparent" />
      </div>

      <div className="glass-card p-6 md:p-8">
        {/* Summary row */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex-1">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-white">${totalBudget.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Allocated</p>
            <p className="text-2xl font-bold text-emerald-400">${spent.toLocaleString()}</p>
          </div>
          {Math.abs(remaining) > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Unallocated</p>
              <p className={`text-lg font-bold ${remaining >= 0 ? "text-slate-400" : "text-red-400"}`}>
                {remaining >= 0 ? "+" : ""}${remaining.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Stacked bar */}
        <div className="h-3 rounded-full overflow-hidden flex mb-8">
          {lines.map((l) => {
            const meta = CATEGORY_META[l.category] ?? FALLBACK;
            return (
              <div
                key={l.category}
                style={{ width: `${l.percentage}%`, backgroundColor: meta.color, transition: "width 0.2s ease" }}
                title={`${l.category}: ${l.percentage}%`}
              />
            );
          })}
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          {lines.map((line) => {
            const meta = CATEGORY_META[line.category] ?? FALLBACK;
            return (
              <div key={line.category} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{line.icon}</span>
                    <span className="text-sm text-slate-300 font-medium">{line.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{line.percentage}%</span>
                    <span className="text-sm font-semibold text-white tabular-nums w-24 text-right">
                      ${line.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={1}
                    max={80}
                    value={line.percentage}
                    onMouseDown={() => setDragging(line.category)}
                    onMouseUp={() => setDragging(null)}
                    onChange={(e) => updateLine(line.category, parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${meta.color} 0%, ${meta.color} ${line.percentage}%, rgba(255,255,255,0.1) ${line.percentage}%, rgba(255,255,255,0.1) 100%)`,
                      accentColor: meta.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-600 mt-6 flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Drag sliders to redistribute budget across service categories
        </p>
      </div>
    </section>
  );
}
