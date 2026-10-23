import test from "node:test";
import assert from "node:assert/strict";
import {
  studentEmail,
  displayName,
  topicInput,
  forumId,
  safeForumNext,
  forumText,
} from "../src/lib/forum/validation";
test("student sign-in accepts only exact verified-domain address forms", () => {
  assert.equal(studentEmail(" Student@SMU.edu "), "student@smu.edu");
  for (const value of [
    "user@smu.edu.evil.example",
    "user@example.org",
    "user@@smu.edu",
    "user@students.smu.edu",
    "user\n@smu.edu",
    null,
  ])
    assert.throws(() => studentEmail(value));
});
test("forum payloads require valid channels and explicit identity choice", () => {
  assert.deepEqual(
    topicInput({
      title: " A question ",
      body: " Useful message ",
      category: "research",
      anonymous: true,
    }),
    {
      title: "A question",
      body: "Useful message",
      category: "research",
      anonymous: true,
    },
  );
  assert.throws(() =>
    topicInput({
      title: "Question",
      body: "message",
      category: "unknown",
      anonymous: false,
    }),
  );
  assert.throws(() =>
    topicInput({
      title: "Question",
      body: "message",
      category: "general",
      anonymous: "false",
    }),
  );
  assert.throws(() => forumText("  ", "Message", 2, 8000));
  assert.throws(() => forumText("bad\u0000message", "Message", 2, 8000));
  assert.throws(() => displayName("Official moderator"));
  assert.equal(displayName(" Alex  Smith "), "Alex Smith");
});
test("forum URLs and record identifiers do not allow redirects or path injection", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  assert.equal(forumId(id), id);
  assert.throws(() => forumId("../posts"));
  assert.equal(safeForumNext("https://evil.example"), "/forum");
  assert.equal(safeForumNext("//evil.example"), "/forum");
  assert.equal(safeForumNext("/forum/login"), "/forum");
  assert.equal(safeForumNext(`/forum/${id}`), `/forum/${id}`);
  assert.equal(safeForumNext("/forum\\evil"), "/forum");
});
