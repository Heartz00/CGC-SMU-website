import assert from "node:assert/strict";
import test from "node:test";
import {
  adminEndpoint,
  currentWordPressUser,
  savePage,
  wordpressRequest,
} from "../src/lib/admin/wordpress";
import { loginLimiter } from "../src/lib/admin/login-limit";
const credentials = {
  username: "example",
  password: "example-app-password",
  userId: 7,
  expires: Date.now() + 60000,
};
test("private requests use HTTPS, disable caching, reject redirects, and keep auth in headers", async () => {
  const original = global.fetch;
  const originalUrl = process.env.WORDPRESS_API_URL;
  process.env.WORDPRESS_API_URL = "https://example.test/wp-json/wp/v2/";
  let calls = 0;
  global.fetch = async (url, options) => {
    calls++;
    assert.equal(
      String(url),
      "https://example.test/wp-json/wp/v2/users/me?context=edit",
    );
    assert.equal(options?.cache, "no-store");
    assert.equal(options?.redirect, "error");
    assert.equal(
      new Headers(options?.headers).get("Authorization"),
      `Basic ${Buffer.from("example:example-app-password").toString("base64")}`,
    );
    return Response.json({
      id: 7,
      name: "Example",
      roles: ["editor"],
      capabilities: { edit_posts: true },
    });
  };
  try {
    assert.equal((await currentWordPressUser(credentials)).id, 7);
    assert.equal(calls, 1);
    assert.throws(() => adminEndpoint("settings"));
    process.env.WORDPRESS_API_URL = "http://example.test/";
    assert.throws(() => adminEndpoint("posts"));
  } finally {
    global.fetch = original;
    if (originalUrl === undefined) delete process.env.WORDPRESS_API_URL;
    else process.env.WORDPRESS_API_URL = originalUrl;
  }
});
test("authentication and permission failures never become editable sessions", async () => {
  const original = global.fetch;
  try {
    global.fetch = async () => new Response("Denied", { status: 401 });
    await assert.rejects(
      currentWordPressUser(credentials),
      /application password/,
    );
    global.fetch = async () =>
      Response.json({
        id: 7,
        roles: ["subscriber"],
        capabilities: { read: true },
      });
    await assert.rejects(
      currentWordPressUser(credentials),
      /Editor or Administrator/,
    );
    global.fetch = async () => new Response("Denied", { status: 403 });
    await assert.rejects(wordpressRequest(credentials, "posts"), /permission/);
  } finally {
    global.fetch = original;
  }
});
test("conflicting WordPress page versions prevent writes", async () => {
  const original = global.fetch;
  let mutations = 0;
  global.fetch = async (_, options) => {
    if (options?.method === "POST") mutations++;
    return Response.json([{ id: 1, modified_gmt: "newer-version" }]);
  };
  try {
    await assert.rejects(
      savePage(
        credentials,
        "cgc-officers",
        "Directory",
        "<p>New</p>",
        "older-version",
      ),
      /Someone else/,
    );
    assert.equal(mutations, 0);
  } finally {
    global.fetch = original;
  }
});
test("query-style WordPress routes support authenticated requests", () => {
  const original = process.env.WORDPRESS_API_URL;
  process.env.WORDPRESS_API_URL =
    "https://example.test/site/?rest_route=/wp/v2/";
  try {
    const url = adminEndpoint("posts/12", { context: "edit" });
    assert.equal(url.searchParams.get("rest_route"), "/wp/v2/posts/12");
    assert.equal(url.searchParams.get("context"), "edit");
  } finally {
    if (original === undefined) delete process.env.WORDPRESS_API_URL;
    else process.env.WORDPRESS_API_URL = original;
  }
});
test("login attempts are bounded and recover after expiry", () => {
  const limiter = loginLimiter(2, 1000, 2);
  assert.equal(limiter.attempt("user", 0), true);
  assert.equal(limiter.attempt("user", 1), true);
  assert.equal(limiter.attempt("user", 2), false);
  assert.equal(limiter.attempt("user", 1000), true);
  limiter.reset("user");
  assert.equal(limiter.attempt("user", 1001), true);
});
