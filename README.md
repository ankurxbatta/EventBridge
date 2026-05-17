# EventBridge

> From messy event idea to vendor-ready plan in 60 seconds.

EventBridge helps live event organizers turn a rough event idea into a structured event blueprint, matched service providers, and ready-to-send outreach messages — powered by GPT-4o.

---

## What It Does

1. **Describe your event** — type a rough idea in plain language
2. **Get a blueprint** — AI generates a structured event plan with name, type, budget, vibe, and summary
3. **See your event stack** — required service categories with priority levels
4. **Review operational risks** — practical risk notes specific to your event
5. **Match vendors** — curated provider cards with fit scores
6. **Generate outreach** — personalised vendor messages written by AI

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/your-org/EventBridge.git
cd EventBridge
npm install

# Configure environment
cp .env.local.example .env.local
# Add your OpenAI API key to .env.local

# Run locally
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key (required) |

Set this in `.env.local` for local dev, and in Vercel Environment Variables for deployment.

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set your env var
vercel env add OPENAI_API_KEY
```

Or connect the GitHub repo in the [Vercel dashboard](https://vercel.com) and add `OPENAI_API_KEY` under Project → Settings → Environment Variables.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI | OpenAI GPT-4o |
| Deployment | Vercel |

---

## Project Structure

```
EventBridge/
├── app/
│   ├── api/generate/route.ts   # OpenAI API route
│   ├── layout.tsx
│   ├── page.tsx                # Main one-page app
│   └── globals.css
├── components/
│   ├── HeroSection.tsx
│   ├── EventInputForm.tsx
│   ├── BlueprintCard.tsx
│   ├── CategoryCard.tsx
│   ├── RiskNotes.tsx
│   └── VendorCard.tsx
├── data/
│   ├── mockVendors.ts
│   └── serviceCategories.ts
├── types/
│   └── index.ts
└── docs/
    ├── PRD.md
    └── DEMO_SCRIPT.md
```

---

## License

MIT
