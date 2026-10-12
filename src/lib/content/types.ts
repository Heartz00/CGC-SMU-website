export type Officer = {
  name: string;
  role: string;
  bio: string;
  term: string;
  termStart?: string;
  termEnd?: string;
  email?: string;
  photo?: string;
};
export type CouncilEvent = {
  id?: string;
  flyer?: string;
  title: string;
  start: string;
  end?: string;
  location: string;
  description: string;
  registration?: string;
  url?: string;
  allDay?: boolean;
};
export type Announcement = {
  historical?: boolean;
  flyer?: string;
  flyerAlt?: string;
  registration?: string;
  id: number;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  html?: string;
  url: string;
  local?: boolean;
};
export type ContentResult<T> = {
  items: T[];
  source: "wordpress" | "fallback";
  unavailable: boolean;
};
