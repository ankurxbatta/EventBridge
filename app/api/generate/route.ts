import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Prompts ────────────────────────────────────────────────────────────────────

const BLUEPRINT_PROMPT = `You are EventOps AI, an expert event operations planner.
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

const CHECKLIST_PROMPT = `You are EventOps AI. Given an event brief, generate a service checklist.
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

const OUTREACH_PROMPT = `You are EventOps AI. Write a short warm vendor outreach message.
Under 120 words. Specific to the event and vendor. Human, not robotic.
No subject line. Start with "Hi [Vendor Name]," end with a clear call to action.`;

const CHAT_PROMPT = (bp: Record<string, unknown>) =>
  `You are EventOps AI, a smart event operations assistant. You know this event in full detail:
Event: ${bp.eventName} | Type: ${bp.eventType} | Location: ${bp.location} | Size: ${bp.audienceSize} | Budget: ${bp.estimatedBudget} | Vibe: ${bp.vibe}
Services needed: ${(bp.requiredServices as string[])?.join(", ")}
Risks: ${(bp.risks as string[])?.join(" | ")}

Answer questions specifically, practically, concisely (2-4 sentences). Reference actual numbers when asked about budget.`;

const QUOTE_REVIEW_PROMPT = `You are EventOps AI. Given an event brief and a provider quote, write a 2-sentence assessment of how well this provider fits the event. Be specific and honest. Start with the fit quality.`;

// ── Handler ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    // Blueprint
    if (type === "blueprint") {
      const { eventIdea } = body;
      if (!eventIdea) return NextResponse.json({ error: "eventIdea required" }, { status: 400 });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: BLUEPRINT_PROMPT },
          { role: "user", content: `Event idea: ${eventIdea}` },
        ],
        temperature: 0.7,
        max_tokens: 900,
        response_format: { type: "json_object" },
      });
      const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
      return NextResponse.json({ blueprint: parsed });
    }

    // Checklist
    if (type === "checklist") {
      const { blueprint } = body;
      if (!blueprint) return NextResponse.json({ error: "blueprint required" }, { status: 400 });

      const prompt = `Event: ${blueprint.eventName}, ${blueprint.eventType}, ${blueprint.location}, ${blueprint.audienceSize}, budget ${blueprint.estimatedBudget}, vibe: ${blueprint.vibe}. Summary: ${blueprint.summary}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: CHECKLIST_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 800,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
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

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: OUTREACH_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 300,
      });
      return NextResponse.json({ message: completion.choices[0]?.message?.content ?? "" });
    }

    // Chat
    if (type === "chat") {
      const { blueprint, messages } = body;
      if (!blueprint || !messages) return NextResponse.json({ error: "blueprint and messages required" }, { status: 400 });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: CHAT_PROMPT(blueprint) },
          ...messages.map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ],
        temperature: 0.7,
        max_tokens: 300,
      });
      return NextResponse.json({ reply: completion.choices[0]?.message?.content ?? "" });
    }

    // Quote review
    if (type === "quote-review") {
      const { blueprint, quote } = body;
      if (!blueprint || !quote) return NextResponse.json({ error: "blueprint and quote required" }, { status: 400 });

      const prompt = `Event: ${blueprint.eventName}, ${blueprint.eventType}, ${blueprint.audienceSize}, vibe: ${blueprint.vibe}. Quote from ${quote.providerName} (${quote.providerCategory}): "${quote.message}". Price: ${quote.price}. Experience: ${quote.experience}.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: QUOTE_REVIEW_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 120,
      });
      return NextResponse.json({ review: completion.choices[0]?.message?.content ?? "" });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  } catch (err: unknown) {
    console.error("API Error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
