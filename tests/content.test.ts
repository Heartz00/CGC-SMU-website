import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  cleanHtml,
  parseCalendarEvent,
  parseEvents,
  parseLegacyOfficers,
  parseOfficers,
  partitionEvents,
  safeUrl,
} from "../src/lib/content/adapters";

test("WordPress content strips executable markup and page-builder shortcodes", () => {
  const result = cleanHtml(
    '<p>[vc_row]Hello[/vc_row]<script>alert(1)</script><a href="javascript:alert(1)" onclick="evil()">link</a><img src=x onerror=evil()></p>',
  );
  assert.ok(result.includes("Hello"));
  assert.ok(!/script|onclick|onerror|vc_row|javascript|<img/.test(result));
  assert.equal(safeUrl("javascript:alert(1)"), undefined);
});
test("standard officer tables map contact links and reject unsafe photos", () => {
  const [officer] = parseOfficers(
    '<table><tr><th>Name</th><th>Role</th><th>Email</th><th>Photo</th></tr><tr><td>Test Student</td><td>President</td><td><a href="mailto:student@smu.edu">Email</a></td><td>https://other.example/photo.jpg</td></tr></table>',
  );
  assert.equal(officer.name, "Test Student");
  assert.equal(officer.email, "student@smu.edu");
  assert.equal(officer.photo, undefined);
});
test("legacy officer content maps names and media without embedding roster assumptions", () => {
  const html =
    '[vc_single_image image=&#8221;123&#8243;]<strong>PRESIDENT:</strong><p>Test Student (<a href="mailto:student@smu.edu">student@smu.edu</a>)</p><p>Example biography</p>[/vc_column_text]';
  const officers = parseLegacyOfficers(html, {
    "123": "https://blog.smu.edu/photo.jpg",
  });
  assert.equal(officers.length, 1);
  assert.equal(officers[0].name, "Test Student");
  assert.equal(officers[0].photo, "https://blog.smu.edu/photo.jpg");
  assert.equal(officers[0].bio, "Example biography");
});
test("events require explicit timezone and partition on event date rather than publication", () => {
  const events = parseEvents(
    "<table><tr><th>Title</th><th>Start</th><th>Location</th></tr><tr><td>Meeting</td><td>2026-10-20T15:00:00-05:00</td><td>Room 1</td></tr><tr><td>Invalid</td><td>2026-10-20T15:00:00</td><td>Room 2</td></tr></table>",
  );
  assert.equal(events.length, 1);
  assert.equal(
    partitionEvents(events, Date.parse("2026-10-11T12:00:00Z")).upcoming.length,
    1,
  );
  assert.equal(
    partitionEvents(events, Date.parse("2026-10-21T12:00:00Z")).past.length,
    1,
  );
});
test("Calendar+ uses provider UTC timestamps across DST and rejects missing dates", () => {
  const event = parseCalendarEvent({
    title: "Meeting",
    desc: "<p>Details</p>",
    location: false,
    calendars: {
      google: {
        url: "https://calendar.google.com/calendar/r/eventedit?dates=20241107T210000Z/20241107T220000Z",
      },
    },
  });
  assert.equal(event?.start, "2024-11-07T21:00:00Z");
  assert.equal(event?.location, "Location to be announced");
  assert.equal(parseCalendarEvent({ title: "Missing date", desc: "" }), null);
});
test("local officer and event fallbacks have the documented schema", () => {
  const officers = JSON.parse(
    readFileSync("src/content/officers.json", "utf8"),
  );
  const events = JSON.parse(readFileSync("src/content/events.json", "utf8"));
  assert.ok(Array.isArray(officers));
  assert.ok(Array.isArray(events));
  for (const officer of officers)
    assert.ok(
      typeof officer.name === "string" &&
        typeof officer.role === "string" &&
        typeof officer.bio === "string" &&
        typeof officer.term === "string",
    );
});
