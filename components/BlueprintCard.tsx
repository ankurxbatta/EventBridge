"use client";

import { useState, useRef, useEffect } from "react";
import { EventBlueprint } from "@/types";

interface Props {
  blueprint: EventBlueprint;
  onChange: (updated: EventBlueprint) => void;
}

const fields = [
  { icon: "🎪", label: "Event Type", key: "eventType" as const },
  { icon: "📍", label: "Location", key: "location" as const },
  { icon: "👥", label: "Audience Size", key: "audienceSize" as const },
  { icon: "⏱️", label: "Duration", key: "duration" as const },
  { icon: "💰", label: "Estimated Budget", key: "estimatedBudget" as const },
  { icon: "✨", label: "Vibe", key: "vibe" as const },
] as const;

function EditableField({
  value,
  onSave,
  multiline = false,
  className = "",
}: {
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim() || value);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) { e.preventDefault(); commit(); }
    if (e.key === "Escape") { setDraft(value); setEditing(false); }
  };

  if (editing) {
    const sharedClass =
      "w-full bg-black/40 border border-violet-500/50 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none text-sm";
    return multiline ? (
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        rows={3}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        className={sharedClass}
      />
    ) : (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        className={sharedClass}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`group/edit text-left w-full rounded-lg px-1 -mx-1 hover:bg-violet-500/10 transition-colors flex items-start gap-1.5 ${className}`}
      title="Click to edit"
    >
      <span className="flex-1">{value}</span>
      <svg
        className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-0 group-hover/edit:opacity-60 text-violet-400 transition-opacity"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  );
}

export default function BlueprintCard({ blueprint, onChange }: Props) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(blueprint.eventName);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) nameRef.current?.focus();
  }, [editingName]);

  const update = (key: keyof EventBlueprint, value: string) => {
    onChange({ ...blueprint, [key]: value });
  };

  const commitName = () => {
    setEditingName(false);
    if (nameDraft.trim()) onChange({ ...blueprint, eventName: nameDraft.trim() });
  };

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

      {/* Edit hint */}
      <p className="text-xs text-slate-600 text-center mb-4 flex items-center justify-center gap-1.5">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Click any field to edit
      </p>

      <div className="glass-card overflow-hidden">
        {/* Header band */}
        <div className="p-6 md:p-8 border-b border-violet-500/10"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.05))" }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">Event Name</p>
              {editingName ? (
                <input
                  ref={nameRef}
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={(e) => { if (e.key === "Enter") commitName(); if (e.key === "Escape") { setNameDraft(blueprint.eventName); setEditingName(false); } }}
                  className="w-full bg-black/40 border border-violet-500/50 rounded-xl px-4 py-2 text-3xl md:text-4xl font-extrabold text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              ) : (
                <button
                  onClick={() => { setNameDraft(blueprint.eventName); setEditingName(true); }}
                  className="group/name text-left flex items-start gap-2 hover:opacity-80 transition-opacity"
                  title="Click to edit"
                >
                  <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                    {blueprint.eventName}
                  </h2>
                  <svg className="w-5 h-5 mt-2 flex-shrink-0 opacity-0 group-hover/name:opacity-60 text-violet-400 transition-opacity"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
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
                <EditableField
                  value={blueprint[field.key]}
                  onSave={(v) => update(field.key, v)}
                  className="text-sm md:text-base text-slate-200 font-medium leading-snug"
                />
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="p-5 rounded-xl border border-violet-500/15 bg-violet-500/5">
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-3">Summary</p>
            <EditableField
              value={blueprint.summary}
              onSave={(v) => update("summary", v)}
              multiline
              className="text-slate-300 text-sm md:text-base leading-relaxed"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
