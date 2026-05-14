"use client";

import { useState } from "react";
import { Vendor, EventBlueprint, VendorStatus } from "@/types";

interface Props {
  vendor: Vendor;
  blueprint: EventBlueprint;
  shortlisted: boolean;
  status: VendorStatus;
  outreach: string;
  onShortlistToggle: (id: string) => void;
  onStatusChange: (id: string, status: VendorStatus) => void;
  onOutreachGenerated: (id: string, message: string) => void;
}

const STATUS_CONFIG: Record<VendorStatus, { label: string; color: string; bg: string; border: string }> = {
  none:       { label: "No status",  color: "text-slate-500",  bg: "bg-slate-800",        border: "border-slate-700" },
  contacted:  { label: "Contacted",  color: "text-blue-400",   bg: "bg-blue-500/10",      border: "border-blue-500/30" },
  interested: { label: "Interested", color: "text-emerald-400", bg: "bg-emerald-500/10",  border: "border-emerald-500/30" },
  passed:     { label: "Passed",     color: "text-slate-500",  bg: "bg-slate-800/50",     border: "border-slate-700/50" },
};

const STATUSES: VendorStatus[] = ["none", "contacted", "interested", "passed"];

export default function VendorCard({
  vendor,
  blueprint,
  shortlisted,
  status,
  outreach,
  onShortlistToggle,
  onStatusChange,
  onOutreachGenerated,
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const fitColor =
    vendor.fitScore >= 90
      ? "text-green-400 border-green-400/30 bg-green-400/10"
      : vendor.fitScore >= 80
      ? "text-cyan-400 border-cyan-400/30 bg-cyan-400/10"
      : "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";

  const currentStatus = STATUS_CONFIG[status];
  const isPassed = status === "passed";

  const handleGenerateOutreach = async () => {
    if (outreach) { setShowOutreach((p) => !p); return; }
    setIsGenerating(true);
    setShowOutreach(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "outreach", vendor, blueprint }),
      });
      const data = await res.json();
      const msg = data.message ?? "Unable to generate message.";
      onOutreachGenerated(vendor.id, msg);
    } catch {
      onOutreachGenerated(vendor.id, "Error generating message. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outreach);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`glass-card p-5 md:p-6 flex flex-col gap-4 transition-all ${isPassed ? "opacity-40 hover:opacity-70" : "hover:border-violet-500/25"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-bold text-base md:text-lg leading-tight">
              {vendor.name}
            </h3>
            {shortlisted && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium">
                Shortlisted
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-violet-400 font-medium">{vendor.category}</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">{vendor.location}</span>
          </div>
        </div>
        {/* Fit Score */}
        <div className={`flex-shrink-0 text-center px-3 py-2 rounded-xl border font-bold ${fitColor}`}>
          <div className="text-lg leading-none">{vendor.fitScore}%</div>
          <div className="text-xs font-normal mt-0.5 opacity-70">fit</div>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center gap-2 text-sm">
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-slate-300 font-medium">{vendor.priceRange}</span>
      </div>

      {/* Why matched */}
      <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
        <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider mb-1.5">Why Matched</p>
        <p className="text-slate-300 text-sm leading-relaxed">{vendor.whyMatched}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {vendor.tags.map((tag) => (
          <span key={tag} className="px-2.5 py-1 rounded-full text-xs bg-slate-800 text-slate-400 border border-slate-700">
            {tag}
          </span>
        ))}
      </div>

      {/* Contact */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {vendor.contact}
      </div>

      {/* Status + Shortlist row */}
      <div className="flex items-center gap-2">
        {/* Status picker */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowStatusMenu((p) => !p)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${currentStatus.bg} ${currentStatus.border} ${currentStatus.color}`}
          >
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${status === "none" ? "bg-slate-600" : status === "contacted" ? "bg-blue-400" : status === "interested" ? "bg-emerald-400" : "bg-slate-600"}`} />
              {currentStatus.label}
            </span>
            <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showStatusMenu && (
            <div className="absolute bottom-full left-0 mb-1 w-full rounded-xl bg-[#13132a] border border-violet-500/20 overflow-hidden z-20 shadow-xl">
              {STATUSES.map((s) => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(vendor.id, s); setShowStatusMenu(false); }}
                    className={`w-full text-left px-3 py-2.5 text-xs font-medium hover:bg-violet-500/10 transition-colors flex items-center gap-2 ${cfg.color}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s === "none" ? "bg-slate-600" : s === "contacted" ? "bg-blue-400" : s === "interested" ? "bg-emerald-400" : "bg-slate-600"}`} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Shortlist toggle */}
        <button
          onClick={() => onShortlistToggle(vendor.id)}
          title={shortlisted ? "Remove from shortlist" : "Add to shortlist"}
          className={`flex-shrink-0 p-2 rounded-lg border transition-all ${
            shortlisted
              ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
              : "bg-black/20 border-white/10 text-slate-500 hover:border-violet-500/30 hover:text-violet-400"
          }`}
        >
          <svg className="w-4 h-4" fill={shortlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Outreach message */}
      {showOutreach && (
        <div className="rounded-xl bg-black/30 border border-cyan-500/15 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">Outreach Message</p>
            {outreach && !isGenerating && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs hover:bg-cyan-500/20 transition-colors"
              >
                {copied ? (
                  <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied!</>
                ) : (
                  <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                )}
              </button>
            )}
          </div>
          {isGenerating ? (
            <div className="space-y-2">
              {[70, 90, 60, 80].map((w, i) => <div key={i} className="h-3 rounded shimmer" style={{ width: `${w}%` }} />)}
            </div>
          ) : (
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{outreach}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleGenerateOutreach}
          disabled={isGenerating}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
            isGenerating ? "bg-slate-800 text-slate-500 cursor-not-allowed"
            : showOutreach && outreach ? "bg-slate-800 border border-slate-700 text-slate-300 hover:border-violet-500/30"
            : "btn-primary text-white"
          }`}
        >
          {isGenerating ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Writing...</>
          ) : showOutreach && outreach ? (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>Hide Message</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>Generate Outreach Message</>
          )}
        </button>
      </div>
    </div>
  );
}
