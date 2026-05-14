import { ServiceCategoryItem } from "@/types";

export const serviceCategories: ServiceCategoryItem[] = [
  {
    name: "Venue",
    priority: "Must-have",
    reason:
      "The event needs a safe, capacity-appropriate physical space with adequate infrastructure.",
  },
  {
    name: "Sound",
    priority: "Must-have",
    reason:
      "The event is music-first and requires a reliable, professional sound system.",
  },
  {
    name: "Lighting",
    priority: "Important",
    reason:
      "Lighting shapes the atmosphere and dramatically improves the live experience.",
  },
  {
    name: "Visuals",
    priority: "Important",
    reason:
      "Projection and visuals support the immersive, psychedelic theme of the event.",
  },
  {
    name: "Food",
    priority: "Optional",
    reason:
      "Food vendors improve attendee comfort, increase dwell time, and add revenue.",
  },
  {
    name: "Security",
    priority: "Must-have",
    reason:
      "Security supports crowd safety, guest flow, and emergency planning.",
  },
  {
    name: "Marketing",
    priority: "Important",
    reason:
      "Marketing helps reach the right audience and drive ticket sales pre-event.",
  },
  {
    name: "Artists / Performers",
    priority: "Must-have",
    reason:
      "The lineup is the core product and primary draw for a music-led event.",
  },
];
