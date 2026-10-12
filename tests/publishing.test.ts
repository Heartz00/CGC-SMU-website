import test from "node:test";
import assert from "node:assert/strict";
import { publishRecord } from "../src/lib/admin/publish-service";
import { eventDraft, isCombinedUpdate } from "../src/lib/admin/publishing";
import { announcementParts } from "../src/lib/content/flyer";
import { eventsTable } from "../src/lib/admin/content";
import { parseEvents } from "../src/lib/content/adapters";
const session = {
  username: "test",
  password: "test",
  userId: 1,
  expires: Date.now() + 10000,
};
const user = {
  id: 1,
  name: "Editor",
  roles: ["editor"],
  capabilities: { edit_posts: true, publish_posts: true, publish_pages: true },
};
function form() {
  const data = new FormData();
  Object.entries({
    title: "ACS NCW",
    body: "Trivia and giveaways",
    calendar: "on",
    start: "2026-10-21T18:00:00-05:00",
    end: "",
    location: "FOSC 158",
    flyer: "",
    registration: "",
    status: "publish",
    postId: "",
    version: "new",
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}
function backend() {
  const posts = new Map<
    number,
    {
      id: number;
      modified_gmt: string;
      status: string;
      content: { raw: string; rendered: string };
    }
  >();
  let page:
    | {
        id: number;
        modified_gmt: string;
        content: { raw: string; rendered: string };
      }
    | undefined;
  let clock = 0;
  let failCalendar = false;
  let writes = 0;
  const fetchMock: typeof fetch = async (input, options) => {
    const url = new URL(String(input));
    const resource = url.pathname.split("/wp/v2/")[1];
    if (options?.method === "POST") {
      writes++;
      const data = JSON.parse(String(options.body));
      const content = { raw: data.content, rendered: data.content };
      if (resource.startsWith("pages")) {
        if (failCalendar) return new Response("Denied", { status: 403 });
        page = { id: 200, modified_gmt: String(++clock), content };
        return Response.json(page);
      }
      const id =
        resource === "posts"
          ? 100 + posts.size
          : Number(resource.split("/")[1]);
      const post = {
        id,
        slug: "acs-ncw",
        modified_gmt: String(++clock),
        status: data.status,
        content,
      };
      posts.set(id, post);
      return Response.json(post);
    }
    if (resource === "pages") return Response.json(page ? [page] : []);
    return Response.json(posts.get(Number(resource.split("/")[1])));
  };
  return {
    fetchMock,
    posts,
    get page() {
      return page;
    },
    get writes() {
      return writes;
    },
    fail(value: boolean) {
      failCalendar = value;
    },
    seedPage() {
      page = {
        id: 200,
        modified_gmt: String(++clock),
        content: {
          raw: "",
          rendered: eventsTable([
            {
              title: "Other event",
              start: "2026-11-01T18:00:00-06:00",
              location: "Lab",
              description: "Existing",
            },
          ]),
        },
      };
    },
  };
}
test("scheduled combined updates remain unpublished and do not create a live calendar row", async () => {
  const original = global.fetch,
    store = backend();
  global.fetch = store.fetchMock;
  try {
    const data = form();
    data.set("status", "future");
    data.set("publishAt", new Date(Date.now() + 86400000).toISOString());
    const result = await publishRecord(session, user, { message: "" }, data);
    assert.equal(result.success, true);
    assert.equal(store.posts.get(result.postId!)?.status, "future");
    assert.equal(store.page, undefined);
    assert.equal(result.eventSaved, false);
    assert.ok(eventDraft(store.posts.get(result.postId!)!.content.raw));
  } finally {
    global.fetch = original;
  }
});
test("combined draft stays private, retains event fields, and removes metadata from public content", async () => {
  const original = global.fetch,
    store = backend();
  global.fetch = store.fetchMock;
  try {
    const data = form();
    data.set("status", "draft");
    const result = await publishRecord(session, user, { message: "" }, data);
    assert.equal(result.success, true);
    assert.equal(store.page, undefined);
    const post = store.posts.get(result.postId!)!;
    assert.equal(post.status, "draft");
    assert.equal(eventDraft(post.content.raw)?.location, "FOSC 158");
    assert.equal(isCombinedUpdate(post.content.raw), true);
    assert.equal(
      announcementParts(post.content.raw).body.includes("data-cgc"),
      false,
    );
  } finally {
    global.fetch = original;
  }
});
test("partial publication retries the same post and upserts one event while preserving unrelated entries", async () => {
  const original = global.fetch,
    store = backend();
  global.fetch = store.fetchMock;
  try {
    store.seedPage();
    store.fail(true);
    const data = form();
    let result = await publishRecord(session, user, { message: "" }, data);
    assert.equal(result.success, undefined);
    assert.match(result.message, /Announcement saved/);
    assert.equal(store.posts.size, 1);
    store.fail(false);
    data.set("postId", String(result.postId));
    data.set("version", result.version!);
    result = await publishRecord(session, user, result, data);
    assert.equal(result.success, true);
    assert.equal(store.posts.size, 1);
    assert.deepEqual(
      result.links?.map((link) => link.href),
      ["/news/acs-ncw", `/events/event-post-${result.postId}`],
    );
    assert.equal(parseEvents(store.page!.content.rendered).length, 2);
    data.set("version", result.version!);
    data.set("title", "Updated ACS NCW");
    result = await publishRecord(session, user, result, data);
    const events = parseEvents(store.page!.content.rendered);
    assert.equal(events.length, 2);
    assert.equal(
      events.find((event) => event.id === `post-${result.postId}`)?.title,
      "Updated ACS NCW",
    );
    data.set("version", result.version!);
    data.set("status", "draft");
    result = await publishRecord(session, user, result, data);
    assert.equal(result.success, true);
    assert.equal(parseEvents(store.page!.content.rendered).length, 1);
    assert.equal(store.posts.get(result.postId!)!.status, "draft");
  } finally {
    global.fetch = original;
  }
});
test("invalid dates, missing permissions, and stale versions cannot overwrite updates", async () => {
  const original = global.fetch,
    store = backend();
  global.fetch = store.fetchMock;
  try {
    const data = form();
    data.set("start", "invalid");
    assert.equal(
      (await publishRecord(session, user, { message: "" }, data)).success,
      false,
    );
    assert.equal(store.writes, 0);
    data.set("start", "2026-10-21T18:00:00-05:00");
    assert.equal(
      (
        await publishRecord(
          session,
          {
            ...user,
            capabilities: { ...user.capabilities, publish_pages: false },
          },
          { message: "" },
          data,
        )
      ).success,
      false,
    );
    assert.equal(store.writes, 0);
    const result = await publishRecord(session, user, { message: "" }, data);
    const writes = store.writes;
    data.set("postId", String(result.postId));
    data.set("version", "stale");
    assert.equal(
      (await publishRecord(session, user, result, data)).success,
      false,
    );
    assert.equal(store.writes, writes);
  } finally {
    global.fetch = original;
  }
});
