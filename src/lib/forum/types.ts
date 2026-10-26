export type ForumCategory = { id: string; label: string; description: string };
export const forumCategories: ForumCategory[] = [
  {
    id: "general",
    label: "General",
    description: "Conversations beyond the lab.",
  },
  {
    id: "research",
    label: "Research & lab life",
    description: "Questions, methods, and shared discoveries.",
  },
  {
    id: "events",
    label: "Events & meetups",
    description: "Find people to learn and unwind with.",
  },
  {
    id: "opportunities",
    label: "Opportunities",
    description: "Funding, conferences, and careers.",
  },
  {
    id: "help",
    label: "Ask the community",
    description: "A little help from your fellow graduates.",
  },
  {
    id: "introductions",
    label: "Introductions",
    description: "New here? Make your first connection.",
  },
];
export type ForumProfile = { display_name: string; name_ready: boolean };
export type ForumPost = {
  id: string;
  body: string;
  author_label: string;
  anonymous: boolean;
  is_mine: boolean;
  created_at: string;
  edited_at: string | null;
  removed?: boolean;
};
export type ForumTopic = ForumPost & {
  title: string;
  category: string;
  pinned: boolean;
  locked: boolean;
  last_activity: string;
  reply_count: number;
};
export type ForumList = { topics: ForumTopic[]; total: number; page: number };
export type ForumDiscussion = {
  topic: ForumTopic;
  replies: ForumPost[];
  total: number;
  page: number;
};
export type ForumResult = {
  success?: boolean;
  message: string;
  next?: string;
};
export type ForumReport = {
  id: string;
  kind: "topic" | "reply";
  target_id: string;
  topic_id: string;
  reason: string;
  created_at: string;
  status: string;
  reporter_email: string;
  author_email: string;
  author_id: string;
  body: string;
  title: string;
  hidden: boolean;
  banned: boolean;
};
export function forumDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Chicago",
  }).format(new Date(value));
}
