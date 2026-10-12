import test from "node:test";
import assert from "node:assert/strict";
import { libraryFile } from "../src/lib/admin/library-file";
const session = {
  username: "editor",
  password: "application-password",
  userId: 1,
  expires: 1000,
};
test("existing-image imports use authenticated media IDs and do not forward credentials to the file", async () => {
  const original = global.fetch;
  let calls = 0;
  global.fetch = async (input, options) => {
    calls++;
    if (String(input).includes("wp-json")) {
      assert.ok(new Headers(options?.headers).get("Authorization"));
      return Response.json({
        media_type: "image",
        source_url: "https://blog.smu.edu/chemgrads/files/2026/10/photo.png",
      });
    }
    assert.equal(options?.redirect, "error");
    assert.equal(options?.cache, "no-store");
    assert.equal(new Headers(options?.headers).get("Authorization"), null);
    return new Response(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]), {
      headers: { "Content-Type": "image/png" },
    });
  };
  try {
    const file = await libraryFile(session, "12");
    assert.equal(file.type, "image/png");
    assert.equal(calls, 2);
    await assert.rejects(libraryFile(session, "../12"));
    assert.equal(calls, 2);
  } finally {
    global.fetch = original;
  }
});
test("existing-image imports reject external hosts, ports, non-images and oversized files", async () => {
  const original = global.fetch;
  try {
    for (const source of [
      "https://evil.example/files/a.png",
      "https://blog.smu.edu:8443/files/a.png",
      "https://blog.smu.edu/chemgrads/wp-admin/a.png",
    ]) {
      let calls = 0;
      global.fetch = async () => {
        calls++;
        return Response.json({ media_type: "image", source_url: source });
      };
      await assert.rejects(libraryFile(session, "12"));
      assert.equal(calls, 1);
    }
    global.fetch = async (input) =>
      String(input).includes("wp-json")
        ? Response.json({
            media_type: "image",
            source_url: "https://blog.smu.edu/chemgrads/files/a.png",
          })
        : new Response("bad", {
            headers: { "Content-Length": String(21 * 1024 * 1024) },
          });
    await assert.rejects(libraryFile(session, "12"));
  } finally {
    global.fetch = original;
  }
});
