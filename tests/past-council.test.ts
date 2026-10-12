import assert from "node:assert/strict";
import test from "node:test";
import { addPastCouncil } from "../src/lib/admin/past-council";
import { parseCouncilHistory } from "../src/lib/content/council-history";
import type { EditablePost } from "../src/lib/admin/wordpress";
function form() {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    version: "new",
    councilLabel: "2024–25",
    councilStart: "2024-08-01",
    councilEnd: "2025-07-31",
    name: "Former Student",
    role: "President",
    bio: "Earlier research",
    term: "",
    email: "",
    photo: "",
  }))
    f.set(k, v);
  return f;
}
const page: EditablePost = {
  id: 10,
  slug: "cgc-council-history",
  modified_gmt: "v2",
  status: "publish",
  link: "https://example.org",
  title: { rendered: "History" },
  content: { rendered: "" },
};
test("past councils save independently and preserve previous archive content", async () => {
  let content = "";
  await addPastCouncil(form(), {
    read: async () => null,
    save: async (value) => {
      content = value;
      return page;
    },
  });
  const [term] = parseCouncilHistory(content);
  assert.equal(term.officers[0].name, "Former Student");
  assert.equal(term.label, "2024–25");
  const next = form();
  next.set("version", "v2");
  next.set("councilLabel", "2023–24");
  await addPastCouncil(next, {
    read: async () => ({ ...page, content: { rendered: content } }),
    save: async (value) => {
      assert.ok(value.startsWith(content));
      assert.equal(parseCouncilHistory(value).length, 2);
      return page;
    },
  });
});
test("past council validation and version conflicts prevent writes", async () => {
  let writes = 0;
  const store = {
    read: async () => null,
    save: async () => {
      writes++;
      return page;
    },
  };
  const invalid = form();
  invalid.set("councilStart", "2024-02-30");
  await assert.rejects(addPastCouncil(invalid, store));
  const empty = form();
  empty.delete("name");
  await assert.rejects(addPastCouncil(empty, store));
  await assert.rejects(
    addPastCouncil(form(), { ...store, read: async () => page }),
  );
  assert.equal(writes, 0);
});
test("duplicate past terms cannot be added twice", async () => {
  let content = "";
  await addPastCouncil(form(), {
    read: async () => null,
    save: async (value) => {
      content = value;
      return page;
    },
  });
  const next = form();
  next.set("version", "v2");
  await assert.rejects(
    addPastCouncil(next, {
      read: async () => ({ ...page, content: { rendered: content } }),
      save: async () => {
        throw new Error("Must not write");
      },
    }),
  );
});
