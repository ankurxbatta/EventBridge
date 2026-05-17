# Contributing — EventBridge

## Prerequisites

- Node.js 18+
- npm 9+
- An OpenAI API key

## Setup

```bash
git clone https://github.com/your-org/EventBridge.git
cd EventBridge
npm install
cp .env.local.example .env.local
# Edit .env.local and add your OPENAI_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Conventions

- **TypeScript strict mode** — all props and API responses must be typed via `types/index.ts`
- **Client components** — mark with `"use client"` at the top; avoid unnecessary client boundaries
- **No external state libraries** — use React `useState`/`useCallback` only
- **Tailwind only** — no CSS modules or inline styles except for gradient backgrounds
- **One API route** — all AI calls go through `/api/generate` with a `type` discriminator

## Adding a Vendor

Edit `data/mockVendors.ts` and add a new entry matching the `Vendor` type in `types/index.ts`.

## Modifying AI Prompts

Both prompts live in `app/api/generate/route.ts`:
- `BLUEPRINT_SYSTEM_PROMPT` — controls JSON structure of the event blueprint
- `OUTREACH_SYSTEM_PROMPT` — controls tone and length of outreach messages

## Branch Strategy

- `main` — production (auto-deploys to Vercel)
- `dev` — staging
- Feature branches: `feat/vendor-filter`, `fix/outreach-copy`, etc.

## Scripts

| Command | Action |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
