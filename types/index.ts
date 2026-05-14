// ─── Core event types ─────────────────────────────────────────────────────────

export interface EventBlueprint {
  eventName: string;
  eventType: string;
  location: string;
  audienceSize: string;
  duration: string;
  estimatedBudget: string;
  vibe: string;
  summary: string;
  requiredServices: string[];
  risks: string[];
}

export interface ChecklistItem {
  id: string;
  service: string;
  icon: string;
  priority: "must-have" | "important" | "optional";
  reason: string;
  estimatedCost: string;
}

// ─── Posted event (lives in localStorage store) ───────────────────────────────

export interface PostedEvent {
  id: string;
  createdAt: string;
  status: "open" | "in-progress" | "closed";
  // Organizer info
  organizerName: string;
  organizerContact: string;
  // Blueprint
  blueprint: EventBlueprint;
  // Selected services
  selectedServices: string[];
  // Budget allocation
  budgetAllocation: Record<string, number>;
  // Quotes received
  quotes: Quote[];
}

// ─── Quote from a provider ────────────────────────────────────────────────────

export interface Quote {
  id: string;
  eventId: string;
  createdAt: string;
  status: "pending" | "accepted" | "declined";
  // Provider info
  providerId: string;
  providerName: string;
  providerCategory: string;
  providerLocation: string;
  // Quote details
  price: string;
  message: string;
  availability: string;
  experience: string;
  portfolioLinks: string[];
}

// ─── Provider profile ─────────────────────────────────────────────────────────

export interface ProviderProfile {
  id: string;
  createdAt: string;
  name: string;
  category: string;
  location: string;
  priceRange: string;
  bio: string;
  experience: string;
  tags: string[];
  portfolioLinks: string[];
  contact: string;
  eventsCompleted: number;
  rating: number;
  verified: boolean;
}

// ─── Vendor (legacy / matched) ────────────────────────────────────────────────

export interface Vendor {
  id: string;
  name: string;
  category: string;
  location: string;
  priceRange: string;
  fitScore: number;
  tags: string[];
  whyMatched: string;
  contact: string;
}

// ─── Organizer workspace state ────────────────────────────────────────────────

export type VendorStatus = "none" | "contacted" | "interested" | "passed";

export interface VendorState {
  shortlisted: boolean;
  status: VendorStatus;
  outreach: string;
}

export interface BudgetLine {
  category: string;
  percentage: number;
  amount: number;
  icon: string;
}

// ─── AI chat ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── UI state ─────────────────────────────────────────────────────────────────

export type OrganizerStep =
  | "input"
  | "checklist"
  | "blueprint"
  | "budget"
  | "vendors"
  | "posted";

export type ProviderView = "browse" | "profile" | "quote";

export const SERVICE_CATEGORIES = [
  "Venue",
  "Sound",
  "Lighting",
  "Visuals",
  "Food",
  "Security",
  "Marketing",
  "Artists / Performers",
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

export type ServicePriority = "Must-have" | "Important" | "Optional";

export interface ServiceCategoryItem {
  name: ServiceCategory;
  priority: ServicePriority;
  reason: string;
}
