import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function geminiGenerate(prompt: string, maxTokens = 1024, temperature = 0.7) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
  const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: { text: prompt },
      temperature,
      maxOutputTokens: maxTokens,
    }),
  });
  const data = await res.json();
  return data?.candidates?.[0]?.output ?? "";
}

// ── Prompts ────────────────────────────────────────────────────────────────────

const BLUEPRINT_PROMPT = `You are EventBridge, an expert event operations planner.
Given a rough event idea, return ONLY a valid JSON object — no text outside it.

{
  "eventName": "Creative punchy name",
  "eventType": "Type of event",
  "location": "City mentioned, or TBD",
  "audienceSize": "e.g. 150 people",
  "duration": "e.g. 1 night, 2 days",
  "estimatedBudget": "Budget mentioned or TBD",
  "vibe": "3-6 comma-separated adjectives",
  "summary": "2-3 sentences, polished",
  "requiredServices": ["from the allowed list only"],
  "risks": ["4-6 specific practical risk notes"]
}

requiredServices MUST only use: Venue, Sound, Lighting, Visuals, Food, Security, Marketing, Artists / Performers
risks must be specific to event type, scale, and location.`;

const CHECKLIST_PROMPT = `You are EventBridge. Given an event brief, generate a service checklist.
Return ONLY a valid JSON object with a "checklist" array — no text outside it.

{
  "checklist": [
    {
      "id": "unique-slug",
      "service": "Service name (from allowed list)",
      "icon": "single emoji",
      "priority": "must-have" | "important" | "optional",
      "reason": "One sentence why this service matters for this specific event",
      "estimatedCost": "e.g. $1,200 – $2,500"
    }
  ]
}

Allowed services: Venue, Sound, Lighting, Visuals, Food, Security, Marketing, Artists / Performers
Order by priority: must-have first. Be specific to the event type and scale.`;

const OUTREACH_PROMPT = `You are EventBridge. Write a short warm vendor outreach message.
Under 120 words. Specific to the event and vendor. Human, not robotic.
No subject line. Start with "Hi [Vendor Name]," end with a clear call to action.`;

const CHAT_PROMPT = (bp: Record<string, unknown>) =>
  `You are EventBridge, a smart event operations assistant. You know this event in full detail:
Event: ${bp.eventName} | Type: ${bp.eventType} | Location: ${bp.location} | Size: ${bp.audienceSize} | Budget: ${bp.estimatedBudget} | Vibe: ${bp.vibe}
Services needed: ${(bp.requiredServices as string[])?.join(", ")}
Risks: ${(bp.risks as string[])?.join(" | ")}

Answer questions specifically, practically, concisely (2-4 sentences). Reference actual numbers when asked about budget.`;

const QUOTE_REVIEW_PROMPT = `You are EventBridge. Given an event brief and a provider quote, write a 2-sentence assessment of how well this provider fits the event. Be specific and honest. Start with the fit quality.`;

// ── Handler ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    // Blueprint
    if (type === "blueprint") {
      const { eventIdea } = body;
      if (!eventIdea) return NextResponse.json({ error: "eventIdea required" }, { status: 400 });

      const prompt = `${BLUEPRINT_PROMPT}\nEvent idea: ${eventIdea}`;
      const output = await geminiGenerate(prompt, 900, 0.7);
      const parsed = JSON.parse(output ?? "{}");
      return NextResponse.json({ blueprint: parsed });
    }

    // Checklist
    if (type === "checklist") {
      const { blueprint } = body;
      if (!blueprint) return NextResponse.json({ error: "blueprint required" }, { status: 400 });

      const prompt = `Event: ${blueprint.eventName}, ${blueprint.eventType}, ${blueprint.location}, ${blueprint.audienceSize}, budget ${blueprint.estimatedBudget}, vibe: ${blueprint.vibe}. Summary: ${blueprint.summary}`;

      const raw = await geminiGenerate(`${CHECKLIST_PROMPT}\n${prompt}`, 800, 0.5);
      const parsed = JSON.parse(raw);
      const checklist = Array.isArray(parsed.checklist)
        ? parsed.checklist
        : Array.isArray(parsed.items)
          ? parsed.items
          : Array.isArray(parsed)
            ? parsed
            : [];
      return NextResponse.json({ checklist });
    }

    // Outreach
    if (type === "outreach") {
      const { vendor, blueprint } = body;
      if (!vendor || !blueprint) return NextResponse.json({ error: "vendor and blueprint required" }, { status: 400 });

      const prompt = `Event: ${blueprint.eventName} (${blueprint.eventType}), ${blueprint.location}, ${blueprint.audienceSize}, budget ${blueprint.estimatedBudget}, vibe: ${blueprint.vibe}. Vendor: ${vendor.name} (${vendor.category}), ${vendor.priceRange}. Why matched: ${vendor.whyMatched}`;

      const message = await geminiGenerate(`${OUTREACH_PROMPT}\n${prompt}`, 300, 0.8);
      return NextResponse.json({ message: message ?? "" });
    }

    // Chat
    if (type === "chat") {
      const { blueprint, messages } = body;
      if (!blueprint || !messages) return NextResponse.json({ error: "blueprint and messages required" }, { status: 400 });

      const convo = [CHAT_PROMPT(blueprint), ...messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)].join("\n\n");
      const reply = await geminiGenerate(convo, 300, 0.7);
      return NextResponse.json({ reply: reply ?? "" });
    }

    // Quote review
    if (type === "quote-review") {
      const { blueprint, quote } = body;
      if (!blueprint || !quote) return NextResponse.json({ error: "blueprint and quote required" }, { status: 400 });

      const prompt = `Event: ${blueprint.eventName}, ${blueprint.eventType}, ${blueprint.audienceSize}, vibe: ${blueprint.vibe}. Quote from ${quote.providerName} (${quote.providerCategory}): "${quote.message}". Price: ${quote.price}. Experience: ${quote.experience}.`;

      const review = await geminiGenerate(`${QUOTE_REVIEW_PROMPT}\n${prompt}`, 120, 0.6);
      return NextResponse.json({ review: review ?? "" });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  } catch (err: unknown) {
    console.error("API Error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
