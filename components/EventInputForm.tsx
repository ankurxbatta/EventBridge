"use client";

import { useState } from "react";

interface Props {
  onGenerate: (idea: string) => void;
  isLoading: boolean;
}

const PLACEHOLDER = `Describe your event idea. 

Example: I want to host a one-night underground music and art event in Vancouver for around 150 people. I need sound, lights, visuals, food, security, and maybe marketing. The vibe should feel immersive, safe, artistic, and community-focused. Budget is around $8,000.`;

export default function EventInputForm({ onGenerate, isLoading }: Props) {
  const [idea, setIdea] = useState("");

  const handleSubmit = () => {
    if (!idea.trim() || isLoading) return;
    onGenerate(idea.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const charCount = idea.length;
  const isReady = charCount >= 20;

  return (
    <section className="px-4 py-12 max-w-4xl mx-auto">
      <div className="glass-card p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Describe Your Event</h2>
            <p className="text-sm text-slate-400">The more detail, the better your blueprint</p>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER}
            rows={7}
            className="w-full bg-black/30 border border-violet-500/20 rounded-xl p-4 text-slate-200 placeholder-slate-600 text-sm md:text-base leading-relaxed resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
          <div className="absolute bottom-3 right-3 text-xs text-slate-600">
            {charCount} chars {charCount > 0 && charCount < 20 && <span className="text-yellow-600">· keep going</span>}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-600 hidden md:block">
            Press <kbd className="px-1.5 py-0.5 rounded border border-slate-700 text-slate-500 text-xs">⌘ Enter</kbd> to generate
          </p>

          <button
            onClick={handleSubmit}
            disabled={!isReady || isLoading}
            className={`
              w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-white text-sm md:text-base transition-all
              ${isReady && !isLoading
                ? "btn-primary cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }
            `}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Blueprint...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Event Blueprint
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
