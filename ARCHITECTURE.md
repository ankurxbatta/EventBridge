# Architecture — EventOps AI

## Overview

EventOps AI is a single-page Next.js application with a thin API layer. The frontend handles all state and UI. The backend consists of a single serverless route that proxies requests to OpenAI.

---

## System Diagram

```
Browser (React)
│
├── HeroSection          Static
├── EventInputForm       User input → triggers API call
│
│   POST /api/generate { type: "blueprint", eventIdea }
│        │
│        └── OpenAI GPT-4o (JSON mode)
│              └── Returns: EventBlueprint JSON
│
├── BlueprintCard        Renders blueprint
├── CategoryCard         Renders static serviceCategories
├── RiskNotes            Renders blueprint.risks (AI-generated)
│
├── VendorCard (×N)      Renders mockVendors
│   │
│   └── [Click: Generate Outreach]
│       │
│       POST /api/generate { type: "outreach", vendor, blueprint }
│            │
│            └── OpenAI GPT-4o
│                  └── Returns: outreach message string
│
└── Copy to clipboard    navigator.clipboard
```

---

## Data Flow

### Blueprint Generation
1. User types event idea in `EventInputForm`
2. `page.tsx` calls `POST /api/generate` with `{ type: "blueprint", eventIdea }`
3. API route sends to GPT-4o with JSON mode enabled
4. Response is parsed and stored in `blueprint` state
5. All downstream sections (CategoryCard, RiskNotes, VendorCard) receive `blueprint` as a prop

### Outreach Generation
1. User clicks "Generate Outreach Message" on a `VendorCard`
2. `VendorCard` calls `POST /api/generate` with `{ type: "outreach", vendor, blueprint }`
3. API route constructs a detailed prompt from both objects
4. Response is stored in local `outreach` state within the card

---

## API Route

**Endpoint:** `POST /app/api/generate`

**Request body types:**

```typescript
// Blueprint
{ type: "blueprint"; eventIdea: string }

// Outreach
{ type: "outreach"; vendor: Vendor; blueprint: EventBlueprint }
```

**Models used:** `gpt-4o` for both calls

**Blueprint prompt:** Uses JSON mode (`response_format: { type: "json_object" }`) to guarantee structured output that maps to `EventBlueprint` type.

**Outreach prompt:** Free-form text generation with temperature 0.8 for natural tone.

---

## State Management

All state lives in `app/page.tsx` via `useState`:

| State | Type | Description |
|---|---|---|
| `blueprint` | `EventBlueprint \| null` | Generated event blueprint |
| `isLoading` | `boolean` | Blueprint generation in progress |
| `error` | `string \| null` | API error message |

Per-vendor outreach state lives in each `VendorCard` instance (isolated).

---

## Static Data

Two data files power the non-AI sections:

- `data/mockVendors.ts` — 8 seeded vendor profiles with fit scores, tags, categories
- `data/serviceCategories.ts` — 8 categories with priority levels and reasons

These are intentionally static for MVP. Future versions would dynamically filter vendors against the AI-generated `requiredServices` list.

---

## Deployment

Deployed as a Next.js app on Vercel. No custom build config required.

Environment variables needed:
- `OPENAI_API_KEY` — set in Vercel → Project → Settings → Environment Variables

The API route runs as a Vercel Serverless Function (Edge-compatible).

---

## Future Improvements

- Dynamic vendor matching based on `blueprint.requiredServices`
- Real vendor database (Supabase or PlanetScale)
- Category filter on vendor section
- Vendor onboarding flow (ProviderJoinModal)
- Email sending integration (Resend or Postmark)
- Auth layer for saving blueprints (Clerk or NextAuth)
