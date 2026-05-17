"use client";

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-900/20 blur-[120px]" />
        <div className="absolute top-[30%] left-[50%] w-[300px] h-[300px] rounded-full bg-pink-900/10 blur-[100px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          AI-Powered Event Operations
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
          <span className="gradient-text">EventBridge</span>
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-slate-300 font-medium mb-4">
          From messy event idea to vendor-ready plan
          <br />
          <span className="text-violet-400">in 60 seconds.</span>
        </p>

        {/* Description */}
        <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
          Describe your event in plain language. EventBridge generates a
          structured blueprint, identifies required services, highlights
          operational risks, matches vendors, and writes your outreach messages.
        </p>

        {/* Steps */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            { num: "01", label: "Describe Event" },
            { num: "02", label: "Get Blueprint" },
            { num: "03", label: "Match Vendors" },
            { num: "04", label: "Send Outreach" },
          ].map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm"
            >
              <span className="text-violet-400 font-bold">{step.num}</span>
              <span className="text-slate-300">{step.label}</span>
            </div>
          ))}
        </div>

        {/* CTA arrow */}
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <span className="text-sm">Enter your event idea below</span>
          <svg
            className="w-5 h-5 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
