import { api } from "./api";
import type { MoonEvent } from "@/types";

export interface CalendarEvent extends MoonEvent {}

export function listEvents(tier?: "astronomical" | "community"): Promise<{ events: MoonEvent[] }> {
  const qs = tier ? `?tier=${encodeURIComponent(tier)}` : "";
  return api.get<{ events: MoonEvent[] }>(`/events${qs}`);
}

export function submitEvent(body: {
  title: string;
  eventDate: string;
  rarity: string;
  synopsis: string;
  category: string;
  source: string;
}): Promise<{ id: string; title: string; eventDate: string; rarity: string; synopsis: string; category: string; source: string; tier: string; approved: boolean }> {
  return api.post("/events", body);
}

export function listCalendarEvents(): Promise<{ events: CalendarEvent[] }> {
  return api.get("/calendar/events");
}

export function saveCalendarEvent(id: string): Promise<{ ok: true }> {
  return api.post(`/calendar/events/${encodeURIComponent(id)}`);
}

export function removeCalendarEvent(id: string): Promise<{ ok: true }> {
  return api.del(`/calendar/events/${encodeURIComponent(id)}`);
}
