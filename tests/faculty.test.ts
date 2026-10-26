import test from "node:test";
import assert from "node:assert/strict";
import { facultyForm } from "../src/lib/admin/faculty";
import { officersTable } from "../src/lib/admin/content";
import { parseOfficers } from "../src/lib/content/adapters";
function form() {
  const data = new FormData();
  for (const prefix of ["advisor", "chair"])
    for (const field of ["Name", "Bio", "Email", "Photo"])
      data.set(prefix + field, "");
  return data;
}
test("faculty profiles round-trip independently with fixed roles and safe text", () => {
  const data = form();
  data.set("advisorName", "Professor Example");
  data.set("advisorBio", "Research & mentorship <script>example</script>");
  data.set("advisorEmail", "advisor@example.edu");
  data.set("chairName", "Professor Sample");
  data.set("role", "President");
  const result = facultyForm(data);
  assert.deepEqual(
    result.map((p) => p.role),
    ["Faculty Advisor", "Department Chair"],
  );
  assert.ok(result.every((p) => p.term === "" && !p.termStart));
  const html = officersTable(result);
  assert.ok(!html.includes("<script>"));
  const parsed = parseOfficers(html);
  assert.equal(parsed[0].bio, result[0].bio);
  assert.equal(parsed[1].name, "Professor Sample");
});
test("faculty drafts can be empty but cannot publish incomplete or unsafe profiles", () => {
  const data = form();
  assert.deepEqual(facultyForm(data), []);
  data.set("advisorBio", "A biography without a name");
  assert.throws(() => facultyForm(data), /full name/);
  data.set("advisorName", "Professor Example");
  data.set("advisorPhoto", "https://outside.example/photo.jpg");
  assert.throws(() => facultyForm(data), /image library/);
  data.set("advisorPhoto", "");
  data.set("advisorEmail", "bad-email");
  assert.throws(() => facultyForm(data), /valid email/);
});
