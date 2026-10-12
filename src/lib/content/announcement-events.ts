import type { Announcement, CouncilEvent } from "./types";
const titleKey = (value: string) =>
  value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
export function announcementEvent(post: Announcement, events: CouncilEvent[]) {
  if (post.linkedEvent)
    return events.find(
      (event) =>
        (event.id && event.id === post.linkedEvent!.id) ||
        (titleKey(event.title) === titleKey(post.linkedEvent!.title) &&
          Date.parse(event.start) === Date.parse(post.linkedEvent!.start)),
    );
  return events.find(
    (event) =>
      post.flyer &&
      event.flyer === post.flyer &&
      Date.parse(event.start) >= Date.parse(post.date) &&
      Date.parse(event.start) - Date.parse(post.date) <=
        90 * 24 * 60 * 60 * 1000 &&
      titleKey(event.title) === titleKey(post.title),
  );
}
export function standaloneAnnouncements(
  posts: Announcement[],
  events: CouncilEvent[],
) {
  return posts.filter((post) => !announcementEvent(post, events));
}
