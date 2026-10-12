import assert from "node:assert/strict";
import test from "node:test";
import { parseEvents, parseOfficers } from "../src/lib/content/adapters";
import { eventsTable, officersTable } from "../src/lib/admin/content";
import { calendarFile } from "../src/lib/content/calendar-file";
import { upsertEvent } from "../src/lib/admin/publishing";
import {
  historyTable,
  parseCouncilHistory,
  councilTermId,
} from "../src/lib/content/council-history";
test("event status survives edits and calendar cancellation keeps the stable UID", () => {
  const event = {
    id: "meeting",
    title: "Meeting",
    start: "2026-10-21T18:00:00-05:00",
    location: "Room",
    description: "Update",
    status: "cancelled" as const,
  };
  assert.equal(parseEvents(eventsTable([event]))[0].status, "cancelled");
  assert.ok(calendarFile(event).includes("STATUS:CANCELLED"));
  assert.ok(calendarFile(event).includes("UID:meeting@cgc.smu.edu"));
  assert.equal(
    upsertEvent([event], { ...event, status: undefined })[0].status,
    "cancelled",
  );
});
test("portrait framing survives current roster and historical snapshots", () => {
  const officer = {
    name: "Student",
    role: "President",
    bio: "Bio",
    term: "2025",
    photoPosition: "top" as const,
  };
  assert.equal(parseOfficers(officersTable([officer]))[0].photoPosition, "top");
  assert.equal(
    parseCouncilHistory(
      historyTable([
        {
          id: councilTermId("2025", "2025-01-01", "2025-12-31"),
          label: "2025",
          start: "2025-01-01",
          end: "2025-12-31",
          officers: [officer],
        },
      ]),
    )[0].officers[0].photoPosition,
    "top",
  );
});
