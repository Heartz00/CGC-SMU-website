import test from "node:test";
import assert from "node:assert/strict";
import {
  announcementContent,
  eventsTable,
  eventsForm,
  needsFormattingConfirmation,
} from "../src/lib/admin/content";
import { announcementParts } from "../src/lib/content/flyer";
import { parseEvents } from "../src/lib/content/adapters";
import { ncwTemplate } from "../src/lib/admin/event-template";
const flyer = "https://blog.smu.edu/chemgrads/files/ncw.png";
test("plain announcement edits need no conversion checkbox while rich content stays protected", () => {
  assert.equal(
    needsFormattingConfirmation(
      "<!-- wp:paragraph --><p>NCW details<br>Dallas time</p><!-- /wp:paragraph -->",
    ),
    false,
  );
  assert.equal(
    needsFormattingConfirmation(
      '<p>Read <a href="https://example.org">more</a></p>',
    ),
    true,
  );
  assert.equal(
    needsFormattingConfirmation('<p style="color:red">Details</p>'),
    true,
  );
});
test("announcement flyers and registration round-trip while preserving rich body content", () => {
  const body =
    '<p>Join us <a href="https://example.org/info">for science</a>.</p>';
  const html = announcementContent(
    body,
    flyer,
    "https://example.org/register?a=1&b=2",
    'ACS "NCW"',
  );
  const result = announcementParts(html);
  assert.equal(result.flyer, flyer);
  assert.equal(result.registration, "https://example.org/register?a=1&b=2");
  assert.equal(result.body, body);
  assert.equal(result.flyerAlt, 'ACS "NCW" flyer');
  assert.equal(
    announcementParts(announcementContent(result.body, "", "", "ACS")).flyer,
    undefined,
  );
});
test("flyer metadata rejects unsafe images and registration links", () => {
  assert.throws(() =>
    announcementContent("<p>text</p>", "https://evil.test/a.png", "", "Title"),
  );
  assert.throws(() =>
    announcementContent("<p>text</p>", flyer, "javascript:alert(1)", "Title"),
  );
  assert.equal(
    announcementParts(
      '<figure data-cgc-flyer><img src="javascript:alert(1)"></figure>',
    ).flyer,
    undefined,
  );
});
test("NCW event flyer persists and uses 6 p.m. Dallas daylight time", () => {
  const form = new FormData();
  Object.entries({
    ...ncwTemplate,
    end: "",
    registration: "https://example.org/register",
    flyer,
  }).forEach(([key, value]) => form.set(key, value));
  const parsed = parseEvents(eventsTable(eventsForm(form)))[0];
  assert.equal(parsed.flyer, flyer);
  assert.equal(parsed.start, "2026-10-21T18:00:00-05:00");
  assert.equal(
    new Date(parsed.start).toISOString(),
    "2026-10-21T23:00:00.000Z",
  );
});
