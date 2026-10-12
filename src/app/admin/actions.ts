"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import {
  adminConfigured,
  clearSession,
  createSession,
  requireAdmin,
  signedIn,
} from "@/lib/admin/auth";
import {
  AdminError,
  currentWordPressUser,
  editablePage,
  savePage,
  wordpressRequest,
  type EditablePost,
} from "@/lib/admin/wordpress";
import {
  editableText,
  announcementContent,
  eventsForm,
  eventsTable,
  officerForm,
  officersTable,
  plainParagraphs,
  textField,
  needsFormattingConfirmation,
} from "@/lib/admin/content";
import { resources } from "@/lib/resources";
import { createHash } from "node:crypto";
import { loginLimiter } from "@/lib/admin/login-limit";
import { announcementParts } from "@/lib/content/flyer";
import { uploadFile, UploadError } from "@/lib/admin/upload";
import type { PublishResult } from "@/lib/admin/publishing";
import { publishRecord } from "@/lib/admin/publish-service";
import { saveFailure, type SaveResult } from "@/lib/admin/save-result";
import { recordErrors } from "@/lib/admin/record-errors";
import { undoCouncilArchive } from "@/lib/admin/council-archive";
import { addPastCouncil } from "@/lib/admin/past-council";
import { homeSettingsTable } from "@/lib/content/home-settings";
import { getAnnouncements, getEvents } from "@/lib/content";
import { eventSlug } from "@/lib/content/event-links";
import { parseOfficers, partitionEvents } from "@/lib/content/adapters";
import {
  councilTermId,
  validTermDate,
  historyTable,
  parseCouncilHistory,
} from "@/lib/content/council-history";
const loginAttempts = loginLimiter();
async function saveAccess(
  capability: string,
): Promise<
  | { ok: true; auth: NonNullable<Awaited<ReturnType<typeof signedIn>>> }
  | { ok: false; result: SaveResult }
> {
  const auth = await signedIn();
  if (!auth)
    return {
      ok: false,
      result: {
        message:
          "Sign-in could not be verified. Open sign-in in a new tab, then retry. Your entries are kept.",
        links: [{ href: "/admin/login", label: "Open sign-in" }],
      },
    };
  if (!auth.user.capabilities[capability])
    return {
      ok: false,
      result: { message: "You do not have permission to save these changes." },
    };
  return { ok: true, auth };
}

export async function publishUpdate(
  previous: PublishResult,
  form: FormData,
): Promise<PublishResult> {
  const access = await saveAccess("edit_posts");
  if (!access.ok) return { ...previous, ...access.result, success: false };
  const { session, user } = access.auth;
  try {
    await sameOrigin();
  } catch (error) {
    return { ...previous, ...saveFailure(error), success: false };
  }
  const result = await publishRecord(session, user, previous, form);
  if (result.postId) refreshContent();
  return result;
}

async function sameOrigin() {
  const request = await headers();
  const origin = request.get("origin");
  const host = request.get("x-forwarded-host") || request.get("host");
  if (!origin || !host || new URL(origin).host !== host)
    throw new AdminError(
      "permission",
      "Please submit this form from the council website.",
    );
}
function failure(error: unknown, path: string): never {
  const kind = error instanceof AdminError ? error.kind : "connection";
  redirect(`${path}?notice=${kind}`);
}
function refreshContent() {
  updateTag("wordpress-content");
  for (const path of [
    "/",
    "/executive-committee",
    "/events",
    "/news",
    "/resources",
  ])
    revalidatePath(path);
  revalidatePath("/news/[slug]", "page");
  revalidatePath("/events/[slug]", "page");
  revalidatePath("/resources/[slug]", "page");
  revalidatePath("/executive-committee/history");
}
export async function saveHomeSettings(form: FormData): Promise<SaveResult> {
  const access = await saveAccess("publish_pages");
  if (!access.ok) return access.result;
  try {
    await sameOrigin();
    const featuredEvent = textField(form, "featuredEvent", 150),
      rawPost = textField(form, "featuredAnnouncement", 20);
    const featuredAnnouncement = rawPost ? Number(rawPost) : undefined;
    const [events, news] = await Promise.all([getEvents(), getAnnouncements()]);
    if (
      featuredEvent &&
      !partitionEvents(events.items).upcoming.some(
        (event) => eventSlug(event) === featuredEvent,
      )
    )
      return {
        message: "Choose an upcoming event.",
        fields: {
          featuredEvent: "This event is no longer upcoming. Choose another.",
        },
      };
    if (
      rawPost &&
      !news.items.some((post) => post.id === featuredAnnouncement && post.local)
    )
      return {
        message: "Choose a published announcement.",
        fields: {
          featuredAnnouncement:
            "This announcement is unavailable. Choose another.",
        },
      };
    const saved = await savePage(
      access.auth.session,
      "cgc-home-settings",
      "CGC Home Settings",
      homeSettingsTable({
        featuredEvent: featuredEvent || undefined,
        featuredAnnouncement,
      }),
      textField(form, "version", 80),
    );
    refreshContent();
    return {
      success: true,
      message: "Saved.",
      version: saved.modified_gmt,
      links: [{ href: "/", label: "View homepage" }],
    };
  } catch (error) {
    return saveFailure(error);
  }
}
export async function saveCouncilTerm(form: FormData): Promise<SaveResult> {
  const access = await saveAccess("publish_pages");
  if (!access.ok) return access.result;
  try {
    await sameOrigin();
    const label = textField(form, "label", 100),
      start = textField(form, "start", 10),
      end = textField(form, "end", 10);
    const fields: Record<string, string> = {};
    if (!label) fields.label = "Enter a term name.";
    if (!validTermDate(start)) fields.start = "Choose a valid start date.";
    if (!validTermDate(end) || end < start)
      fields.end = "Choose an end on or after the start.";
    if (Object.keys(fields).length)
      return { message: "Check the marked fields.", fields };
    const page = await editablePage(
      access.auth.session,
      process.env.WORDPRESS_MANAGED_OFFICERS_SLUG || "cgc-officers",
    );
    if (!page)
      return { message: "Save the current roster before setting its term." };
    const officers = parseOfficers(page.content.rendered).map((officer) => ({
      ...officer,
      term: label,
      termStart: start,
      termEnd: end,
    }));
    if (!officers.length)
      return { message: "Add council members before setting the term." };
    const saved = await savePage(
      access.auth.session,
      page.slug,
      "CGC Officer Directory",
      officersTable(officers),
      textField(form, "version", 80),
    );
    refreshContent();
    revalidatePath("/admin/officers");
    revalidatePath("/admin/handover");
    return {
      success: true,
      message: "Term saved.",
      version: saved.modified_gmt,
      links: [{ href: "/executive-committee", label: "View council" }],
    };
  } catch (error) {
    return saveFailure(error);
  }
}
export async function archiveCouncil(form: FormData): Promise<SaveResult> {
  const access = await saveAccess("publish_pages");
  if (!access.ok) return access.result;
  try {
    await sameOrigin();
    if (form.get("confirmArchive") !== "on")
      return {
        message: "Confirm the members shown before archiving.",
        fields: { confirmArchive: "Confirm this is the outgoing council." },
      };
    const label = textField(form, "label", 100),
      start = textField(form, "start", 10),
      end = textField(form, "end", 10);
    const fields: Record<string, string> = {};
    if (!label) fields.label = "Enter a term name.";
    if (!validTermDate(start)) fields.start = "Choose a valid start date.";
    if (!validTermDate(end) || end < start)
      fields.end = "Choose an end on or after the start.";
    if (Object.keys(fields).length)
      return { message: "Check the marked fields.", fields };
    const roster = await editablePage(
      access.auth.session,
      process.env.WORDPRESS_MANAGED_OFFICERS_SLUG || "cgc-officers",
    );
    if (!roster)
      return { message: "Save the current roster before archiving it." };
    if (roster.modified_gmt !== textField(form, "rosterVersion", 80))
      return {
        message:
          "The roster changed. Reload the handover page before archiving.",
      };
    const officers = parseOfficers(roster.content.rendered);
    if (!officers.length)
      return { message: "Add council members before archiving." };
    const history = await editablePage(
        access.auth.session,
        "cgc-council-history",
      ),
      terms = parseCouncilHistory(history?.content.rendered || ""),
      id = councilTermId(label, start, end);
    if (terms.some((term) => term.id === id))
      return {
        message:
          "This term is already archived. The existing snapshot was kept.",
      };
    if (terms.length >= 60)
      return {
        message: "The archive is full. Contact the site administrator.",
      };
    const saved = await savePage(
      access.auth.session,
      "cgc-council-history",
      "CGC Council History",
      historyTable([...terms, { id, label, start, end, officers }]),
      textField(form, "version", 80),
    );
    refreshContent();
    revalidatePath("/admin/handover");
    return {
      success: true,
      message: "Council archived. The current roster is unchanged.",
      version: saved.modified_gmt,
      links: [
        { href: "/executive-committee/history", label: "View council history" },
      ],
    };
  } catch (error) {
    return saveFailure(error);
  }
}
export async function undoArchive(form: FormData): Promise<SaveResult> {
  const access = await saveAccess("publish_pages");
  if (!access.ok) return access.result;
  try {
    await sameOrigin();
    const saved = await undoCouncilArchive(
      textField(form, "termId", 100),
      textField(form, "version", 80),
      {
        read: () => editablePage(access.auth.session, "cgc-council-history"),
        save: (content, expected) =>
          savePage(
            access.auth.session,
            "cgc-council-history",
            "CGC Council History",
            content,
            expected,
          ),
      },
    );
    refreshContent();
    revalidatePath("/admin/handover");
    return {
      success: true,
      message: "Archive undone. Current officers were kept.",
      version: saved.modified_gmt,
    };
  } catch (error) {
    return saveFailure(error);
  }
}
export async function savePastCouncil(form: FormData): Promise<SaveResult> {
  const access = await saveAccess("publish_pages");
  if (!access.ok) return access.result;
  try {
    await sameOrigin();
    const fields = recordErrors(form, "officers");
    if (Object.keys(fields).length)
      return { message: "Check the marked fields.", fields };
    const saved = await addPastCouncil(form, {
      read: () => editablePage(access.auth.session, "cgc-council-history"),
      save: (content, expected) =>
        savePage(
          access.auth.session,
          "cgc-council-history",
          "CGC Council History",
          content,
          expected,
        ),
    });
    refreshContent();
    revalidatePath("/admin/handover");
    return {
      success: true,
      message: "Past council saved.",
      version: saved.modified_gmt,
      links: [
        { href: "/executive-committee/history", label: "View council history" },
      ],
    };
  } catch (error) {
    return saveFailure(error);
  }
}
export async function login(form: FormData) {
  try {
    await sameOrigin();
    if (!adminConfigured())
      throw new AdminError("permission", "Dashboard not configured.");
    const username = textField(form, "username", 100);
    const attemptKey = createHash("sha256")
      .update(username.toLowerCase())
      .digest("hex");
    if (!loginAttempts.attempt(attemptKey))
      throw new AdminError("authentication", "Too many attempts. Try later.");
    const password = textField(form, "password", 100).replace(/\s/g, "");
    if (
      !username ||
      username.includes(":") ||
      !/^[a-zA-Z0-9]{24}$/.test(password)
    )
      throw new AdminError(
        "authentication",
        "Use a WordPress application password.",
      );
    const user = await currentWordPressUser({ username, password });
    await createSession(username, password, user.id);
    loginAttempts.reset(attemptKey);
  } catch (error) {
    failure(error, "/admin/login");
  }
  redirect("/admin");
}
export async function logout() {
  await sameOrigin();
  await clearSession();
  redirect("/admin/login");
}
export async function saveOfficers(form: FormData): Promise<SaveResult> {
  const access = await saveAccess("publish_pages");
  if (!access.ok) return access.result;
  const { session } = access.auth;
  try {
    await sameOrigin();
    const fields = recordErrors(form, "officers");
    if (Object.keys(fields).length)
      return {
        message: "Check the marked fields. Your entries are kept.",
        fields,
      };
    const rows = officerForm(form);
    const saved = await savePage(
      session,
      process.env.WORDPRESS_MANAGED_OFFICERS_SLUG || "cgc-officers",
      "CGC Officer Directory",
      officersTable(rows),
      textField(form, "version", 80),
    );
    refreshContent();
    return {
      success: true,
      message: "Saved.",
      version: saved.modified_gmt,
      links: [{ href: "/executive-committee", label: "View council page" }],
    };
  } catch (error) {
    return saveFailure(error);
  }
}
export async function saveEvents(form: FormData): Promise<SaveResult> {
  const access = await saveAccess("publish_pages");
  if (!access.ok) return access.result;
  const { session } = access.auth;
  try {
    await sameOrigin();
    const fields = recordErrors(form, "events");
    if (Object.keys(fields).length)
      return {
        message: "Check the marked fields. Your entries are kept.",
        fields,
      };
    const saved = await savePage(
      session,
      process.env.WORDPRESS_EVENTS_SLUG || "events",
      "CGC Events",
      eventsTable(eventsForm(form)),
      textField(form, "version", 80),
    );
    refreshContent();
    return {
      success: true,
      message: "Saved.",
      version: saved.modified_gmt,
      links: [{ href: "/events", label: "View events" }],
    };
  } catch (error) {
    return saveFailure(error);
  }
}
export async function saveAnnouncement(form: FormData): Promise<SaveResult> {
  const access = await saveAccess("edit_posts");
  if (!access.ok) return access.result;
  const { session, user } = access.auth;
  let saved: EditablePost;
  try {
    await sameOrigin();
    const id = textField(form, "id", 20);
    const version = textField(form, "version", 80);
    const title = textField(form, "title", 200);
    const body = textField(form, "body", 50000);
    const status = textField(form, "status", 10);
    const flyer = textField(form, "flyer", 1000);
    const registration = textField(form, "registration", 1000);
    if (status === "publish" && !user.capabilities.publish_posts)
      throw new AdminError("permission", "Publishing permission is required.");
    if (!title || !body || !["draft", "publish"].includes(status))
      throw new AdminError(
        "validation",
        "Check title, body, and publishing permission.",
      );
    if (id) {
      if (!/^\d+$/.test(id))
        throw new AdminError("validation", "Invalid announcement.");
      const current = await wordpressRequest<EditablePost>(
        session,
        `posts/${id}`,
        { query: { context: "edit" } },
      );
      if (current.modified_gmt !== version)
        throw new AdminError(
          "conflict",
          "Announcement was changed by another editor.",
        );
      const original = editableText(
        announcementParts(current.content.raw || current.content.rendered).body,
      );
      const content = body === original ? undefined : plainParagraphs(body);
      if (
        content &&
        needsFormattingConfirmation(
          announcementParts(current.content.raw || current.content.rendered)
            .body,
        ) &&
        form.get("replace") !== "on"
      )
        throw new AdminError(
          "validation",
          "Confirm the text conversion before changing existing content.",
        );
      saved = await wordpressRequest<EditablePost>(session, `posts/${id}`, {
        method: "POST",
        body: {
          title,
          status,
          content: announcementContent(
            content ||
              announcementParts(current.content.raw || current.content.rendered)
                .body,
            flyer,
            registration,
            title,
          ),
        },
      });
    } else
      saved = await wordpressRequest<EditablePost>(session, "posts", {
        method: "POST",
        body: {
          title,
          status,
          content: announcementContent(
            plainParagraphs(body),
            flyer,
            registration,
            title,
          ),
        },
      });
    refreshContent();
    return {
      success: true,
      message: status === "draft" ? "Draft saved." : "Published.",
      version: saved.modified_gmt,
      postId: saved.id,
      links:
        status === "publish"
          ? [{ href: `/news/${saved.slug}`, label: "View announcement" }]
          : [],
    };
  } catch (error) {
    if (error instanceof AdminError && error.kind === "validation") {
      const fields: Record<string, string> = error.message.includes(
        "conversion",
      )
        ? { replace: "Confirm replacing this formatting before saving." }
        : error.message.includes("image") ||
            error.message.includes("registration")
          ? {
              flyer: "Choose an image from the library.",
              registration:
                "Use a link starting with https://, or leave it blank.",
            }
          : {
              title: "Use 1–200 characters.",
              body: "Use 1–50,000 characters.",
            };
      return { ...saveFailure(error), fields };
    }
    return saveFailure(error);
  }
}
export async function saveResource(form: FormData): Promise<SaveResult> {
  const access = await saveAccess("publish_pages");
  if (!access.ok) return access.result;
  const { session } = access.auth;
  let slug = "";
  try {
    await sameOrigin();
    slug = textField(form, "slug", 100);
    const resource = resources.find((item) => item.slug === slug);
    if (!resource) throw new AdminError("validation", "Unsupported resource.");
    const page = await editablePage(session, resource.wordpressSlug);
    if (!page) throw new AdminError("validation", "Resource page is missing.");
    const body = textField(form, "body", 50000);
    const original = editableText(page.content.raw || page.content.rendered);
    if (body !== original && form.get("replace") !== "on")
      throw new AdminError(
        "validation",
        "Confirm conversion to simple paragraphs before saving.",
      );
    const saved = await savePage(
      session,
      resource.wordpressSlug,
      page.title.raw || page.title.rendered,
      body === original
        ? page.content.raw || page.content.rendered
        : plainParagraphs(body),
      textField(form, "version", 80),
    );
    refreshContent();
    return {
      success: true,
      message: "Saved.",
      version: saved.modified_gmt,
      links: [{ href: `/resources/${slug}`, label: "View resource" }],
    };
  } catch (error) {
    return {
      ...saveFailure(error),
      fields:
        error instanceof AdminError && error.message.includes("conversion")
          ? { replace: "Confirm replacing this formatting before saving." }
          : undefined,
    };
  }
}
export async function uploadImage(form: FormData): Promise<SaveResult> {
  const access = await saveAccess("upload_files");
  if (!access.ok) return access.result;
  const { session } = access.auth;
  try {
    await sameOrigin();
    const file = await uploadFile(form.get("image"));
    const description = form.get("alt");
    if (
      typeof description !== "string" ||
      !description.trim() ||
      description.length > 300
    )
      throw new UploadError("image-description");
    const body = new FormData();
    body.set("file", file, file.name.replace(/[^\w.-]/g, "_"));
    body.set("alt_text", description.trim());
    await wordpressRequest(session, "media", { method: "POST", body });
    revalidatePath("/admin/media");
    return { success: true, message: "Uploaded." };
  } catch (error) {
    if (error instanceof UploadError)
      return {
        message: "Check the image and description. Your entries are kept.",
        fields:
          error.notice === "image-description"
            ? { alt: "Enter 1–300 characters." }
            : {
                image:
                  error.notice === "image-size"
                    ? "Choose an image up to 2 MB after resizing."
                    : "Choose a valid JPEG, PNG, or WebP image.",
              },
      };
    return saveFailure(error);
  }
}
export async function grantEditor(form: FormData) {
  const { session, user } = await requireAdmin("promote_users");
  try {
    await sameOrigin();
    const id = textField(form, "userId", 20);
    if (!/^\d+$/.test(id) || Number(id) === user.id)
      throw new AdminError(
        "validation",
        "Choose another existing site member.",
      );
    // Only existing members of this site can be assigned editor access. Never
    // create institutional identities or grant Administrator through this UI.
    const target = await wordpressRequest<{ roles: string[] }>(
      session,
      `users/${id}`,
      { query: { context: "edit" } },
    );
    if (
      !Array.isArray(target.roles) ||
      !target.roles.length ||
      target.roles.includes("administrator")
    )
      throw new AdminError(
        "permission",
        "Use WordPress to manage administrators or site membership.",
      );
    await wordpressRequest(session, `users/${id}`, {
      method: "POST",
      body: { roles: ["editor"] },
    });
  } catch (error) {
    failure(error, "/admin/access");
  }
  redirect("/admin/access?notice=saved");
}
