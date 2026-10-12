import assert from "node:assert/strict";
import test from "node:test";
import {
  featureFirst,
  homeSettingsTable,
  parseHomeSettings,
} from "../src/lib/content/home-settings";
import {
  councilTermId,
  historyTable,
  parseCouncilHistory,
  validTermDate,
} from "../src/lib/content/council-history";
import { officerForm, officersTable } from "../src/lib/admin/content";
import { parseOfficers } from "../src/lib/content/adapters";

test("homepage selections round-trip and reject injected or invalid identifiers", () => {
  assert.deepEqual(
    parseHomeSettings(
      homeSettingsTable({
        featuredEvent: "event-post-504",
        featuredAnnouncement: 504,
      }),
    ),
    { featuredEvent: "event-post-504", featuredAnnouncement: 504 },
  );
  assert.deepEqual(
    parseHomeSettings(
      homeSettingsTable({
        featuredEvent: "<script>alert(1)</script>",
        featuredAnnouncement: -1,
      }),
    ),
    { featuredEvent: undefined, featuredAnnouncement: undefined },
  );
});
test("featuring preserves order and falls back when a pin expires or disappears", () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
  assert.deepEqual(
    featureFirst(items, 2, (item) => item.id).map((item) => item.id),
    [2, 1, 3],
  );
  assert.equal(
    featureFirst(items, 99, (item) => item.id),
    items,
  );
  assert.deepEqual(
    items.map((item) => item.id),
    [1, 2, 3],
  );
});
test("term dates reject impossible dates and officer tables preserve valid term dates", () => {
  assert.equal(validTermDate("2026-02-30"), false);
  assert.equal(validTermDate("2028-02-29"), true);
  const officer = {
    name: "Student",
    role: "President",
    bio: "Biography",
    term: "2026–27",
    termStart: "2026-08-01",
    termEnd: "2027-07-31",
  };
  assert.equal(
    parseOfficers(officersTable([officer]))[0].termStart,
    officer.termStart,
  );
  assert.equal(
    parseOfficers(officersTable([{ ...officer, termStart: "2026-02-30" }]))[0]
      .termStart,
    undefined,
  );
  const form = new FormData();
  for (const [key, value] of Object.entries({
    ...officer,
    email: "",
    photo: "",
  }))
    form.set(key, value);
  assert.equal(officerForm(form)[0].termEnd, officer.termEnd);
  form.set("termEnd", "2025-01-01");
  assert.throws(() => officerForm(form));
});
test("archived councils round-trip escaped biographies and sort newest terms first", () => {
  const older = {
    id: councilTermId("2025–26", "2025-08-01", "2026-07-31"),
    label: "2025–26",
    start: "2025-08-01",
    end: "2026-07-31",
    officers: [
      {
        name: "A & B",
        role: "President",
        bio: "<script>text</script> & research",
        term: "2025–26",
      },
    ],
  };
  const newer = {
    ...older,
    id: councilTermId("2026–27", "2026-08-01", "2027-07-31"),
    label: "2026–27",
    start: "2026-08-01",
    end: "2027-07-31",
  };
  const html = historyTable([older, newer]);
  assert.ok(!html.includes("<script>"));
  const terms = parseCouncilHistory(html);
  assert.deepEqual(
    terms.map((term) => term.label),
    ["2026–27", "2025–26"],
  );
  assert.equal(terms[1].officers[0].bio, older.officers[0].bio);
  assert.equal(terms[1].id, older.id);
  assert.deepEqual(
    parseCouncilHistory(historyTable([{ ...older, end: "2024-07-31" }])),
    [],
  );
});
