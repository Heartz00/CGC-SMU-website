import test from "node:test";
import assert from "node:assert/strict";
import { readDraft, snapshotDraft } from "../src/lib/admin/content-draft";
test("recovery captures content but never credentials or concurrency fields", () => {
  const data = new FormData();
  data.set("title", "Chemistry night");
  data.set("body", "Join us");
  data.set("password", "secret");
  data.set("version", "old");
  data.set("postId", "3");
  data.set("status", "publish");
  assert.deepEqual(snapshotDraft(data, 100).fields, {
    title: "Chemistry night",
    body: "Join us",
  });
});
test("recovery validates its schema, size and expiration", () => {
  const raw = JSON.stringify({
    version: 1,
    savedAt: 100,
    fields: { title: "Event", password: "secret" },
  });
  assert.deepEqual(readDraft(raw, 200)?.fields, { title: "Event" });
  assert.equal(readDraft(raw, 8 * 24 * 60 * 60 * 1000), null);
  assert.equal(readDraft(raw, 50), null);
  assert.equal(readDraft("{bad", 200), null);
  assert.equal(
    readDraft(
      JSON.stringify({ version: 1, savedAt: 100, fields: { body: 1 } }),
      200,
    ),
    null,
  );
});
