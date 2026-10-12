import assert from "node:assert/strict";
import test from "node:test";
import { undoCouncilArchive } from "../src/lib/admin/council-archive";
import {
  councilTermId,
  historyTable,
  parseCouncilHistory,
} from "../src/lib/content/council-history";
import type { EditablePost } from "../src/lib/admin/wordpress";
const makeTerm = (label: string) => ({
  id: councilTermId(label, "2025-01-01", "2026-09-01"),
  label,
  start: "2025-01-01",
  end: "2026-09-01",
  officers: [
    {
      name: "Current Student",
      role: "President",
      bio: "Research",
      term: label,
    },
  ],
});
const a = makeTerm("2025–26"),
  b = makeTerm("Other term");
const page: EditablePost = {
  id: 510,
  slug: "cgc-council-history",
  modified_gmt: "v1",
  status: "publish",
  link: "https://example.org",
  title: { rendered: "History" },
  content: { rendered: historyTable([a, b]) + "<p>Keep this note.</p>" },
};
test("undo removes only the selected archive and preserves other records and content", async () => {
  let saved = "";
  await undoCouncilArchive(a.id, "v1", {
    read: async () => page,
    save: async (content, expected) => {
      assert.equal(expected, "v1");
      saved = content;
      return { ...page, modified_gmt: "v2" };
    },
  });
  assert.deepEqual(
    parseCouncilHistory(saved).map((t) => t.id),
    [b.id],
  );
  assert.ok(saved.includes("Keep this note."));
  assert.equal(parseCouncilHistory(page.content.rendered).length, 2);
});
test("undoing the last archive leaves an empty history without touching the roster", async () => {
  const only = { ...page, content: { rendered: historyTable([a]) } };
  await undoCouncilArchive(a.id, "v1", {
    read: async () => only,
    save: async (content) => {
      assert.deepEqual(parseCouncilHistory(content), []);
      return only;
    },
  });
  assert.equal(a.officers[0].name, "Current Student");
});
test("stale or missing archives cannot write", async () => {
  let writes = 0;
  const store = {
    read: async () => page,
    save: async () => {
      writes++;
      return page;
    },
  };
  await assert.rejects(undoCouncilArchive(a.id, "stale", store));
  await assert.rejects(undoCouncilArchive("term-missing", "v1", store));
  assert.equal(writes, 0);
});
