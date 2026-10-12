import type { CouncilEvent } from "./types";
export function eventKey(event: CouncilEvent) {
  if (event.id && /^[a-zA-Z0-9_-]{1,100}$/.test(event.id)) return event.id;
  const value = event.id || `${event.title}|${event.start}`;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++)
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16);
}
export const eventSlug = (event: CouncilEvent) => `event-${eventKey(event)}`;
export const eventPath = (event: CouncilEvent) => `/events/${eventSlug(event)}`;
