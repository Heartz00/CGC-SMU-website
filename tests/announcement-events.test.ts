import test from "node:test";
import assert from "node:assert/strict";
import { standaloneAnnouncements } from "../src/lib/content/announcement-events";
import type { Announcement, CouncilEvent } from "../src/lib/content/types";
const event: CouncilEvent = {
  id: "post-5",
  title: "NCW",
  start: "2026-10-21T18:00:00-05:00",
  location: "Fondren",
  description: "Chemistry",
  flyer: "https://blog.smu.edu/chemgrads/files/ncw.png",
};
const post: Announcement = {
  id: 5,
  title: "NCW",
  slug: "ncw",
  date: "2026-10-12",
  excerpt: "Chemistry",
  url: "https://example.org",
  linkedEvent: event,
};
test("linked event updates are listed once while general updates remain", () => {
  const general = {
    ...post,
    id: 6,
    title: "Funding update",
    linkedEvent: undefined,
  };
  assert.deepEqual(standaloneAnnouncements([post, general], [event]), [
    general,
  ]);
  assert.deepEqual(standaloneAnnouncements([post], []), [post]);
});
test("legacy duplicates require matching title and flyer; recaps and recurring events remain", () => {
  const legacy = { ...post, linkedEvent: undefined, flyer: event.flyer };
  assert.deepEqual(standaloneAnnouncements([legacy], [event]), []);
  assert.equal(
    standaloneAnnouncements([{ ...legacy, title: "NCW recap" }], [event])
      .length,
    1,
  );
  assert.equal(
    standaloneAnnouncements([{ ...legacy, flyer: undefined }], [event]).length,
    1,
  );
  assert.equal(
    standaloneAnnouncements([{ ...legacy, date: "2025-10-12" }], [event])
      .length,
    1,
  );
  assert.equal(
    standaloneAnnouncements([{ ...legacy, date: "2026-10-22" }], [event])
      .length,
    1,
  );
  assert.equal(
    standaloneAnnouncements(
      [
        {
          ...post,
          linkedEvent: {
            ...event,
            id: "different",
            start: "2027-10-21T18:00:00-05:00",
          },
        },
      ],
      [event],
    ).length,
    1,
  );
});
