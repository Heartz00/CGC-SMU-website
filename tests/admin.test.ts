import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import {
  openSession,
  sealSession,
  sessionKey,
} from "../src/lib/admin/session-codec";
import {
  eventsForm,
  eventsTable,
  officerForm,
  officersTable,
  plainParagraphs,
} from "../src/lib/admin/content";
import { parseEvents, parseOfficers } from "../src/lib/content/adapters";
import { dallasLocalTime, dallasToIso } from "../src/lib/admin/date-time";
test("date picker converts Dallas daylight/standard time and rejects spring clock gaps", () => {
  assert.equal(dallasToIso("2026-10-20T15:00"), "2026-10-20T20:00:00.000Z");
  assert.equal(dallasToIso("2026-01-20T15:00"), "2026-01-20T21:00:00.000Z");
  assert.equal(dallasToIso("2026-03-08T02:30"), "");
  assert.equal(dallasLocalTime("2026-10-20T20:00:00Z"), "2026-10-20T15:00");
  const form = new FormData();
  Object.entries({
    title: "Meeting",
    start: dallasToIso("2026-10-20T15:00"),
    end: "",
    location: "Room 1",
    description: "",
    registration: "",
  }).forEach(([key, value]) => form.set(key, value));
  assert.equal(eventsForm(form)[0].start, "2026-10-20T20:00:00.000Z");
});

test("session credentials are encrypted, expire, and reject tampering and wrong keys", () => {
  const secret = randomBytes(32).toString("base64");
  const value = {
    username: "example",
    password: "private-app-password",
    userId: 7,
    expires: 2000,
  };
  const token = sealSession(value, secret);
  assert.ok(!token.includes(value.password));
  assert.deepEqual(openSession(token, secret, 1000), value);
  assert.equal(openSession(token, secret, 2000), null);
  assert.equal(
    openSession(token, randomBytes(32).toString("base64"), 1000),
    null,
  );
  const bytes = Buffer.from(token, "base64url");
  bytes[30] ^= 1;
  assert.equal(openSession(bytes.toString("base64url"), secret, 1000), null);
  assert.throws(() => sessionKey("short"));
});
test("officer editor round-trips escaped content through the WordPress table adapter", () => {
  const form = new FormData();
  Object.entries({
    name: "Example <Student>",
    role: "President",
    bio: "Science & community",
    term: "2026–2027",
    email: "student@smu.edu",
    photo: "https://blog.smu.edu/photo.jpg",
  }).forEach(([k, v]) => form.set(k, v));
  const values = officerForm(form);
  const html = officersTable(values);
  assert.ok(!html.includes("<Student>"));
  assert.deepEqual(parseOfficers(html), values);
  form.set("photo", "javascript:alert(1)");
  assert.throws(() => officerForm(form));
});
test("event editor rejects invalid timezones and round-trips valid events", () => {
  const form = new FormData();
  Object.entries({
    title: "Meeting",
    start: "2026-10-20T15:00:00-05:00",
    end: "2026-10-20T16:00:00-05:00",
    location: "Room 1",
    description: "Bring ideas",
    registration: "https://example.com/register",
  }).forEach(([k, v]) => form.set(k, v));
  const events = eventsForm(form);
  assert.deepEqual(parseEvents(eventsTable(events)), events);
  form.set("start", "2026-10-20T15:00:00");
  assert.throws(() => eventsForm(form));
});
test("simple announcement paragraphs cannot inject markup", () => {
  const html = plainParagraphs("Hello\nworld\n\n<script>alert(1)</script>");
  assert.ok(html.includes("<br />"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
});
