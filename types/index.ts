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

export interface ServiceCategory {
  name: string;
  priority: "Must-have" | "Important" | "Optional";
  reason: string;
}

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

export interface OutreachMessage {
  vendorId: string;
  message: string;
}

export type AppState =
  | "idle"
  | "generating-blueprint"
  | "blueprint-ready"
  | "generating-outreach";
