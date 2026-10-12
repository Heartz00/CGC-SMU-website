import assert from "node:assert/strict";
import test from "node:test";
import { albumTable, parseAlbums } from "../src/lib/content/albums";
import { publicationDate } from "../src/lib/admin/scheduling";
import { activeHomeSettings } from "../src/lib/content/home-settings";
import {
  attendanceForm,
  attendanceTable,
  parseAttendance,
  saveAttendanceRecord,
} from "../src/lib/admin/attendance";
test("attendance writes remain private and reject stale versions before writing", async () => {
  const original = global.fetch,
    form = new FormData();
  for (const [k, v] of Object.entries({
    eventId: "event-1",
    eventTitle: "NCW",
    registered: "12",
    attended: "0",
    version: "new",
  }))
    form.set(k, v);
  let writes = 0;
  global.fetch = async (_, options) => {
    if (options?.method !== "POST") return Response.json([]);
    writes++;
    const body = JSON.parse(String(options.body));
    assert.equal(body.status, "private");
    assert.ok(body.content.includes("12"));
    return Response.json({ modified_gmt: "v2" });
  };
  const session = {
    username: "test",
    password: "test",
    userId: 1,
    expires: Date.now() + 10000,
  };
  try {
    await saveAttendanceRecord(session, form);
    assert.equal(writes, 1);
    form.set("version", "stale");
    await assert.rejects(saveAttendanceRecord(session, form));
    assert.equal(writes, 1);
  } finally {
    global.fetch = original;
  }
});
import { restoreVersion, type Revision } from "../src/lib/admin/revisions";
import type { EditablePost } from "../src/lib/admin/wordpress";
test("albums preserve captions and descriptions without accepting external or executable image URLs", () => {
  const photo = {
    album: "Outreach & science",
    date: "2026-10-12",
    url: "https://blog.smu.edu/chemgrads/files/photo.jpg",
    caption: "<script>text</script>",
    alt: "Students at an outreach event",
  };
  const html = albumTable([photo]);
  assert.ok(!html.includes("<script>"));
  assert.deepEqual(parseAlbums(html), [photo]);
  assert.deepEqual(
    parseAlbums(
      albumTable([{ ...photo, url: "https://other.example/image.png" }]),
    ),
    [],
  );
  assert.deepEqual(parseAlbums(albumTable([{ ...photo, alt: "" }])), []);
});
test("scheduled publishing validates future timestamps and preserves Dallas offset conversion", () => {
  const now = Date.parse("2026-10-12T12:00:00Z");
  assert.equal(
    publicationDate("future", "2026-10-21T18:00:00-05:00", now),
    "2026-10-21T23:00:00.000",
  );
  assert.throws(() => publicationDate("future", "2026-10-12T11:00:00Z", now));
  assert.throws(() => publicationDate("future", "2026-10-21T18:00", now));
  assert.equal(publicationDate("draft", "", now), undefined);
});
test("homepage pins expire after the selected day in Dallas rather than UTC", () => {
  const settings = { featuredAnnouncement: 504, featuredUntil: "2026-10-12" };
  assert.equal(
    activeHomeSettings(settings, new Date("2026-10-13T04:59:00Z"))
      .featuredAnnouncement,
    504,
  );
  assert.equal(
    activeHomeSettings(settings, new Date("2026-10-13T05:01:00Z"))
      .featuredAnnouncement,
    undefined,
  );
});
test("attendance totals preserve zero and reject negative or excessive counts", () => {
  const form = new FormData();
  form.set("eventId", "event-1");
  form.set("eventTitle", "NCW");
  form.set("registered", "0");
  form.set("attended", "12");
  const rows = attendanceForm(form);
  assert.deepEqual(parseAttendance(attendanceTable(rows)), rows);
  form.set("registered", "-1");
  assert.throws(() => attendanceForm(form));
  form.set("registered", "100001");
  assert.throws(() => attendanceForm(form));
});
test("restoring a revision rejects stale and wrong-parent snapshots without changing publication status", async () => {
  const current: EditablePost = {
    id: 1,
    slug: "page",
    status: "private",
    modified_gmt: "v1",
    title: { rendered: "Current" },
    content: { rendered: "Current" },
    link: "https://example.org",
  };
  const revision: Revision = {
    id: 2,
    parent: 1,
    author: 3,
    date_gmt: "2026-10-12T12:00:00",
    title: { raw: "Earlier", rendered: "Earlier" },
    content: {
      raw: "<p>Original formatting</p>",
      rendered: "<p>Original formatting</p>",
    },
  };
  let writes = 0;
  const save = async (body: object) => {
    writes++;
    assert.deepEqual(body, {
      title: "Earlier",
      content: "<p>Original formatting</p>",
    });
    return current;
  };
  await assert.rejects(restoreVersion(1, "stale", revision, current, save));
  await assert.rejects(
    restoreVersion(1, "v1", { ...revision, parent: 9 }, current, save),
  );
  assert.equal(writes, 0);
  await restoreVersion(1, "v1", revision, current, save);
  assert.equal(writes, 1);
});
