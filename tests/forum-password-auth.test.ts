import test from "node:test";
import assert from "node:assert/strict";
import { passwordForumAuth } from "../src/lib/forum/password-auth";
import { forumPassword } from "../src/lib/forum/validation";

test("forum passwords preserve exact input and enforce creation limits", () => {
  assert.equal(forumPassword("  my passphrase  ", true), "  my passphrase  ");
  assert.equal(forumPassword("olderpw"), "olderpw");
  assert.throws(() => forumPassword("short", true));
  assert.throws(() => forumPassword("x".repeat(129), true));
  assert.throws(() => forumPassword(null));
});

test("registration is blocked before signup unless confirmation emails are disabled", async () => {
  let calls = 0;
  const result = {
    data: {
      user: { email: "student@smu.edu" },
      session: { access_token: "test-only" },
    },
    error: null,
  };
  const client = {
    auth: {
      signUp: async () => {
        calls++;
        return result;
      },
      signInWithPassword: async () => result,
    },
  };
  const credentials = {
    email: "student@smu.edu",
    password: "a forum password",
  };
  await assert.rejects(
    passwordForumAuth(client, credentials, true, false),
    /registration is not available/,
  );
  assert.equal(calls, 0);
  await passwordForumAuth(client, credentials, true, true);
  assert.equal(calls, 1);
  await passwordForumAuth(client, credentials, false);
  assert.equal(calls, 1, "Sign-in does not create or replace an account");
});

test("password sign-in requires a real session and returns safe failure messages", async () => {
  const credentials = {
    email: "student@smu.edu",
    password: "a forum password",
  };
  const missingSession = {
    data: { user: { email: credentials.email }, session: null },
    error: null,
  };
  const client = {
    auth: {
      signUp: async () => missingSession,
      signInWithPassword: async () => missingSession,
    },
  };
  await assert.rejects(
    passwordForumAuth(client, credentials, false),
    /Could not sign in/,
  );
  const limited = {
    auth: {
      ...client.auth,
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { status: 429 },
      }),
    },
  };
  await assert.rejects(
    passwordForumAuth(limited, credentials, false),
    /Please wait/,
  );
});
