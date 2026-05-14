"use client";

import { useState, useRef, useEffect } from "react";
import { EventBlueprint, ChatMessage } from "@/types";

interface Props {
  blueprint: EventBlueprint;
}

const SUGGESTED = [
  "Is my budget realistic for this event size?",
  "What permits might I need in this city?",
  "What should I book first?",
  "What are the biggest risks I should plan for?",
  "How far in advance should I confirm vendors?",
];

export default function AskAI({ blueprint }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `I know your event inside out — ${blueprint.eventName} in ${blueprint.location} for ${blueprint.audienceSize} with a ${blueprint.estimatedBudget} budget. What do you want to know?`,
      }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, blueprint, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          blueprint,
          messages: [...messages, userMsg],
        }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { role: "assistant", content: data.reply ?? "Sorry, I couldn't answer that." }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "Something went wrong. Try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="px-4 py-6 max-w-4xl mx-auto animate-fade-in-up">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
        <div className="flex items-center gap-2 text-pink-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="text-sm font-semibold uppercase tracking-wider">Ask the AI</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-pink-500/30 via-pink-500/30 to-transparent" />
      </div>

      <div className="glass-card overflow-hidden">
        {/* Toggle header */}
        <button
          onClick={() => setOpen((p) => !p)}
          className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🤖</span>
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">Ask anything about your event</p>
              <p className="text-slate-500 text-xs">Budget, permits, timing, logistics — contextual to {blueprint.eventName}</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="border-t border-white/5">
            {/* Suggested questions */}
            {messages.length <= 1 && (
              <div className="px-5 pt-4 pb-2 flex flex-wrap gap-2">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="px-3 py-1.5 rounded-full text-xs bg-pink-500/10 border border-pink-500/20 text-pink-300 hover:bg-pink-500/20 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="px-5 py-4 space-y-4 max-h-80 overflow-y-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">⚡</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-violet-600/30 border border-violet-500/20 text-slate-200 rounded-tr-sm"
                        : "bg-black/30 border border-white/5 text-slate-300 rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">⚡</span>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 pb-5">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
                  placeholder="Ask about your event..."
                  className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/40 transition-colors"
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || isLoading}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    input.trim() && !isLoading ? "btn-primary text-white" : "bg-slate-800 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
