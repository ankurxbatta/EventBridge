import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const BLUEPRINT_SYSTEM_PROMPT = `You are EventOps AI, an expert event operations planner. 
When given a rough event idea, you extract and structure it into a clean event blueprint as JSON.

Return ONLY a valid JSON object with these exact fields:
{
  "eventName": "Creative name for the event",
  "eventType": "Type of event (e.g. Underground Music & Art Event)",
  "location": "City or location mentioned, or 'TBD'",
  "audienceSize": "Expected audience (e.g. '150 people')",
  "duration": "How long (e.g. '1 night', '2 days')",
  "estimatedBudget": "Budget mentioned or 'TBD'",
  "vibe": "Comma-separated adjectives describing the vibe",
  "summary": "2-3 sentence polished summary of the event",
  "requiredServices": ["Array", "of", "service", "categories", "needed"],
  "risks": ["Array of 4-6 specific operational risk notes for this event type"]
}

requiredServices should be chosen from: Venue, Sound, Lighting, Visuals, Food, Security, Marketing, Artists / Performers
Be specific and creative with the event name. Keep it punchy and relevant to the vibe.
risks should be practical and specific to this event type, location, and scale.
Do not include any text outside the JSON object.`;

const OUTREACH_SYSTEM_PROMPT = `You are EventOps AI. Write a short, professional, warm vendor outreach message.
Keep it under 120 words. Be specific to the event and vendor. Sound human, not robotic.
Do not include subject lines. Start with "Hi [Vendor Name]," and end with a clear call to action.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, eventIdea, vendor, blueprint } = body;

    if (type === "blueprint") {
      if (!eventIdea || typeof eventIdea !== "string") {
        return NextResponse.json(
          { error: "eventIdea is required" },
          { status: 400 }
        );
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: BLUEPRINT_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Here is the event idea: ${eventIdea}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw);

      return NextResponse.json({ blueprint: parsed });
    }

    if (type === "outreach") {
      if (!vendor || !blueprint) {
        return NextResponse.json(
          { error: "vendor and blueprint are required" },
          { status: 400 }
        );
      }

      const prompt = `
Event Blueprint:
- Event Name: ${blueprint.eventName}
- Event Type: ${blueprint.eventType}
- Location: ${blueprint.location}
- Audience Size: ${blueprint.audienceSize}
- Duration: ${blueprint.duration}
- Budget: ${blueprint.estimatedBudget}
- Vibe: ${blueprint.vibe}
- Summary: ${blueprint.summary}

Vendor:
- Name: ${vendor.name}
- Category: ${vendor.category}
- Why matched: ${vendor.whyMatched}
- Price Range: ${vendor.priceRange}

Write a warm outreach message from the event organizer to this vendor.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: OUTREACH_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 300,
      });

      const message = completion.choices[0]?.message?.content ?? "";
      return NextResponse.json({ message });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: unknown) {
    console.error("API Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
