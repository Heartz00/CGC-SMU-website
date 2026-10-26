import test from "node:test";
import assert from "node:assert/strict";
import { facultyForm } from "../src/lib/admin/faculty";
import { officersTable } from "../src/lib/admin/content";
import { parseOfficers } from "../src/lib/content/adapters";
import { parseFaculty } from "../src/lib/content/adapters";
import { defaultFaculty, facultyImage } from "../src/lib/content/faculty";
function form() {
  const data = new FormData();
  for (const prefix of ["advisor", "chair"])
    for (const field of ["Name", "Bio", "Email", "Photo"])
      data.set(prefix + field, "");
  return data;
}
test("official faculty photos survive editing without expanding student photo permissions", () => {
  const data = form();
  for (const [i, key] of ["advisor", "chair"].entries()) {
    const person = defaultFaculty[i];
    data.set(`${key}Name`, person.name);
    data.set(`${key}Bio`, person.bio);
    data.set(`${key}Email`, person.email);
    data.set(`${key}Photo`, person.photo);
  }
  const saved = facultyForm(data);
  const html = officersTable(saved);
  assert.deepEqual(
    parseFaculty(html).map((p) => p.photo),
    defaultFaculty.map((p) => p.photo),
  );
  assert.ok(parseOfficers(html).every((p) => !p.photo));
  assert.deepEqual(
    parseFaculty(officersTable([])),
    [],
    "An intentionally cleared profile list stays empty",
  );
  for (const url of [
    "https://outside.example/photo.jpg",
    "https://www.smu.edu/unrelated.jpg",
    "https://user:pass@www.smu.edu/-/media/site/dedman/departments-official/chemistry/directory/a.jpg",
    "https://www.smu.edu:444/-/media/site/dedman/departments-official/chemistry/directory/a.jpg",
  ])
    assert.equal(facultyImage(url), false);
});
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
