import "server-only";
import type { AdminSession } from "./session-codec";
import {
  AdminError,
  editablePage,
  savePage,
  wordpressRequest,
  type EditablePost,
  type WordPressUser,
} from "./wordpress";
import {
  textField,
  eventsForm,
  eventsTable,
  announcementContent,
  plainParagraphs,
} from "./content";
import {
  draftMarker,
  eventDraft,
  isCombinedUpdate,
  upsertEvent,
  type PublishResult,
} from "./publishing";
import { parseEvents, safeUrl, validDate } from "../content/adapters";
import { wordpressImage } from "../content/flyer";
import { eventPath } from "../content/event-links";
import { publicationDate } from "./scheduling";
function dateLabel(value: string) {
  return (
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "America/Chicago",
    }).format(new Date(value)) + " Dallas time"
  );
}
export async function publishRecord(
  session: AdminSession,
  user: WordPressUser,
  previous: PublishResult,
  form: FormData,
): Promise<PublishResult> {
  let saved: EditablePost | undefined;
  let hadEvent = false;
  const fields: Record<string, string> = {};
  try {
    const title = textField(form, "title", 200);
    const body = textField(form, "body", 50000);
    const status = textField(form, "status", 10);
    const date_gmt = publicationDate(
      status,
      String(form.get("publishAt") || ""),
    );
    const flyer = textField(form, "flyer", 1000);
    const registration = textField(form, "registration", 1000);
    const calendar = form.get("calendar") === "on";
    if (!title) fields.title = "Enter a title.";
    if (!body) fields.body = "Enter a description.";
    if (flyer && !wordpressImage(flyer))
      fields.flyer = "Choose an image from the library.";
    if (registration && !safeUrl(registration))
      fields.registration = "Use an https:// link, or leave it blank.";
    if (calendar) {
      const start = String(form.get("start") || ""),
        end = String(form.get("end") || "");
      if (!validDate(start))
        fields.start = "Choose a valid Dallas date and time.";
      if (end && (!validDate(end) || Date.parse(end) < Date.parse(start)))
        fields.end = "The end must follow the start.";
      if (!String(form.get("location") || "").trim())
        fields.location = "Enter a location.";
      if (body.length > 5000)
        fields.body = "Event descriptions must be 5,000 characters or fewer.";
    }
    if (Object.keys(fields).length)
      throw new AdminError(
        "validation",
        "Check the marked fields. Your entries are kept.",
      );
    if (!title || !body || !["draft", "publish", "future"].includes(status))
      throw new AdminError("validation", "Add a title and description.");
    if (
      ["publish", "future"].includes(status) &&
      (!user.capabilities.publish_posts ||
        (calendar && !user.capabilities.publish_pages))
    )
      throw new AdminError(
        "permission",
        "You do not have publishing permission.",
      );
    let event;
    if (calendar) {
      const data = new FormData();
      for (const [key, value] of Object.entries({
        title,
        description: body,
        flyer,
        registration,
        start: textField(form, "start", 40),
        end: textField(form, "end", 40),
        location: textField(form, "location", 300),
      }))
        data.set(key, value);
      event = eventsForm(data)[0];
      if (!event.location.trim())
        throw new AdminError("validation", "Add an event location.");
    }
    const content =
      announcementContent(
        plainParagraphs(
          event
            ? `${dateLabel(event.start)}\n${event.location}\n\n${body}`
            : body,
        ),
        flyer,
        registration,
        title,
      ) +
      '<div data-cgc-update="true" hidden></div>' +
      (event ? draftMarker(event) : "");
    const id = textField(form, "postId", 20);
    if (id) {
      if (!/^\d+$/.test(id))
        throw new AdminError("validation", "Invalid update.");
      const current = await wordpressRequest<EditablePost>(
        session,
        `posts/${id}`,
        { query: { context: "edit" } },
      );
      if (!isCombinedUpdate(current.content.raw || current.content.rendered))
        throw new AdminError(
          "validation",
          "Use the announcement editor for this post.",
        );
      hadEvent = !!eventDraft(current.content.raw || current.content.rendered);
      if (hadEvent && !user.capabilities.publish_pages)
        throw new AdminError(
          "permission",
          "You do not have calendar editing permission.",
        );
      if (current.modified_gmt !== textField(form, "version", 80))
        throw new AdminError(
          "conflict",
          "This update changed. Reload before saving.",
        );
    }
    saved = await wordpressRequest<EditablePost>(
      session,
      id ? `posts/${id}` : "posts",
      {
        method: "POST",
        body: { title, content, status, ...(date_gmt ? { date_gmt } : {}) },
      },
    );
    if (
      (event && status === "publish") ||
      hadEvent ||
      (id && user.capabilities.publish_pages)
    ) {
      const savedId = saved.id;
      const slug = process.env.WORDPRESS_EVENTS_SLUG || "events";
      const page = await editablePage(session, slug);
      const currentList = page ? parseEvents(page.content.rendered) : [];
      const list =
        event && status === "publish"
          ? upsertEvent(currentList, { ...event, id: `post-${saved.id}` })
          : currentList.filter((item) => item.id !== `post-${savedId}`);
      if (list.length > 80)
        throw new AdminError(
          "validation",
          "The calendar is full. Remove an old event before retrying.",
        );
      if ((event && status === "publish") || list.length !== currentList.length)
        await savePage(
          session,
          slug,
          "CGC Events",
          eventsTable(list),
          page?.modified_gmt || "new",
        );
    }
    return {
      message:
        status === "future"
          ? "Scheduled. Calendar details will appear after publication."
          : status === "draft"
            ? "Draft saved."
            : event
              ? "Announcement and event published."
              : "Published.",
      success: true,
      postId: saved.id,
      version: saved.modified_gmt,
      eventSaved: !!event && status === "publish",
      links:
        status === "publish"
          ? [
              { href: `/news/${saved.slug}`, label: "View announcement" },
              ...(event
                ? [
                    {
                      href: eventPath({ ...event, id: `post-${saved.id}` }),
                      label: "View event",
                    },
                  ]
                : []),
            ]
          : [],
    };
  } catch (error) {
    const message =
      error instanceof AdminError &&
      ["validation", "conflict", "permission"].includes(error.kind)
        ? error.message.replace(/WordPress/g, "the site")
        : "Could not save. Please try again.";
    if (saved) {
      return {
        message: `Announcement saved. Calendar update failed: ${message} Retry to finish.`,
        postId: saved.id,
        version: saved.modified_gmt,
      };
    }
    return { ...previous, success: false, message, fields, links: [] };
  }
}
