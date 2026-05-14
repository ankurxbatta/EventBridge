# Product Requirements Document — EventOps AI

## Problem

Organizing live events starts with chaos. Organizers typically have a rough idea, a budget guess, and scattered vendor contacts. They waste hours figuring out what services they need, which vendors fit their event, and how to communicate professionally.

## Solution

EventOps AI creates an instant event operations brief from a plain-language event description. It structures the idea, identifies required services, surfaces operational risks, matches relevant vendors, and generates personalized outreach messages.

## Target Users

**Primary:** Live event organizers — music events, conferences, festivals, birthday parties, corporate meetups, community gatherings.

**Secondary (future):** Service providers who want to be discoverable — sound companies, lighting crews, venues, food vendors, security firms.

## Core Workflow

```
Organizer types event idea
       ↓
GPT-4o generates structured blueprint
       ↓
App shows required service categories (static)
       ↓
App shows operational risks (AI-generated, per event)
       ↓
App shows matched vendors (static mock data)
       ↓
GPT-4o writes personalized outreach per vendor
```

## MVP Scope

### In scope
- Single-page app (no login, no DB, no payments)
- Real AI blueprint generation (GPT-4o)
- Static service categories with priorities
- Static mock vendor profiles (8 vendors)
- Real AI outreach message generation per vendor
- Copy-to-clipboard on outreach messages

### Out of scope (v2+)
- User authentication
- Real vendor database
- Real email sending
- Dynamic vendor matching
- Admin dashboard
- Payment system
- Calendar booking

## Success Criteria

A judge should understand the product in 60 seconds:
1. I enter an event idea
2. The app turns it into an event blueprint
3. The app tells me what services I need
4. The app matches vendors
5. The app writes vendor outreach messages

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Real AI vs mock | Real AI | Judges will type their own events — mock breaks immediately |
| Which calls use AI | Blueprint + outreach | These are the two highest-value outputs |
| Vendor matching | Static | Avoids complexity; still demonstrates the concept |
| State management | useState only | No need for Redux/Zustand in a single page |
| Styling | Tailwind + custom CSS | Fast to build, dark event-tech aesthetic |
