import test from "node:test";
import assert from "node:assert/strict";
import { eventPath, eventKey } from "../src/lib/content/event-links";
import { calendarFile } from "../src/lib/content/calendar-file";
import { recordErrors } from "../src/lib/admin/record-errors";
import { safeUrl } from "../src/lib/content/adapters";
import { wordpressImage } from "../src/lib/content/flyer";
const event = {
  id: "post-123",
  title: "ACS NCW",
  start: "2026-10-21T18:00:00-05:00",
  location: "FOSC 158",
  description: "Trivia, giveaways; experts",
  registration: "https://example.org/register",
};
test("public links and images reject URLs containing embedded credentials", () => {
  assert.equal(safeUrl("https://user:password@example.org"), undefined);
  assert.equal(
    wordpressImage("https://user:password@blog.smu.edu/photo.png"),
    undefined,
  );
});
test("event links remain stable when an identified event changes", () => {
  assert.equal(eventPath(event), "/events/event-post-123");
  assert.equal(
    eventPath({
      ...event,
      title: "Updated",
      start: "2026-10-22T18:00:00-05:00",
    }),
    eventPath(event),
  );
  assert.match(eventKey({ ...event, id: "../../bad/id" }), /^[a-f0-9]+$/);
});
test("calendar downloads use UTC, escape text and fold Unicode without injection", () => {
  const value = calendarFile(
    {
      ...event,
      title: "研究".repeat(60),
      description: "Line\rBEGIN:BAD\nComma,semi;slash\\",
    },
    new Date("2026-10-11T00:00:00Z"),
  );
  assert.ok(value.includes("DTSTART:20261021T230000Z\r\n"));
  assert.ok(value.includes("Line\\nBEGIN:BAD\\nComma\\,semi\\;slash\\\\"));
  assert.ok(!value.includes("\r\nBEGIN:BAD"));
  for (const line of value.split("\r\n"))
    assert.ok(Buffer.byteLength(line) <= 75);
  assert.equal(
    value
      .split("\r\n ")
      .join("")
      .includes("SUMMARY:" + "研究".repeat(60)),
    true,
  );
});
test("all-day downloads use exclusive calendar dates across Dallas fall DST", () => {
  const value = calendarFile({
    ...event,
    start: "2026-11-01T00:00:00-05:00",
    allDay: true,
  });
  assert.ok(value.includes("DTSTART;VALUE=DATE:20261101"));
  assert.ok(value.includes("DTEND;VALUE=DATE:20261102"));
});
test("record errors identify the affected field and row", () => {
  const form = new FormData();
  form.append("name", "First");
  form.append("role", "President");
  form.append("name", "Second");
  form.append("role", "");
  form.append("email", "");
  form.append("email", "bad");
  const errors = recordErrors(form, "officers");
  assert.equal(errors["name:0"], undefined);
  assert.ok(errors["role:1"]);
  assert.ok(errors["email:1"]);
});
