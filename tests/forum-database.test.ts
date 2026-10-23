import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

test("forum database enforces membership, anonymous privacy, ownership and moderation", async () => {
  const db = new PGlite();
  const alex = "11111111-1111-4111-8111-111111111111",
    bea = "22222222-2222-4222-8222-222222222222",
    outsider = "33333333-3333-4333-8333-333333333333",
    unverified = "44444444-4444-4444-8444-444444444444";
  async function asUser(id: string) {
    await db.exec("reset role;set role authenticated;");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  }
  async function asModerator() {
    await db.exec("reset role;set role service_role;");
  }
  async function rpc<T>(
    name: string,
    args: string = "",
    values: unknown[] = [],
  ): Promise<T> {
    const result = await db.query<Record<string, T>>(
      `select public.${name}(${args}) as value`,
      values,
    );
    return result.rows[0].value;
  }
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated,service_role;grant execute on function auth.uid() to authenticated,service_role;
      insert into auth.users values ('${alex}','alex@smu.edu',now()),('${bea}','bea@smu.edu',now()),('${outsider}','outside@example.org',now()),('${unverified}','unverified@smu.edu',null);`);
    await db.exec(
      readFileSync(
        path.join(
          process.cwd(),
          "supabase/migrations/202610220001_student_forum.sql",
        ),
        "utf8",
      ),
    );
    await asUser(outsider);
    await assert.rejects(rpc("cgc_forum_profile"), /verified SMU/);
    await asUser(unverified);
    await assert.rejects(rpc("cgc_forum_profile"), /verified SMU/);
    await db.exec("reset role;set role anon;");
    await assert.rejects(rpc("cgc_forum_feed"), /permission denied/);
    await asUser(alex);
    await rpc("cgc_forum_profile");
    await rpc("cgc_forum_set_profile", "$1", ["Alex"]);
    const topic = await rpc<string>("cgc_forum_create_topic", "$1,$2,$3,$4", [
      "A lab question",
      "Has anyone tried the shared instrument?",
      "research",
      true,
    ]);
    const another = await rpc<string>("cgc_forum_create_topic", "$1,$2,$3,$4", [
      "Another question",
      "A different conversation.",
      "general",
      true,
    ]);
    await asUser(bea);
    await rpc("cgc_forum_set_profile", "$1", ["Bea"]);
    const feed = await rpc<{
      topics: { id: string; author_label: string; is_mine: boolean }[];
    }>("cgc_forum_feed");
    const serialized = JSON.stringify(feed);
    assert.ok(!serialized.includes(alex));
    assert.ok(!serialized.includes("alex@"));
    assert.ok(!serialized.includes('"Alex"'));
    const first = feed.topics.find((item) => item.id === topic)!;
    assert.match(first.author_label, /^Anonymous student /);
    assert.equal(first.is_mine, false);
    assert.notEqual(
      first.author_label,
      feed.topics.find((item) => item.id === another)!.author_label,
    );
    await assert.rejects(
      db.query("select * from cgc_forum.members"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select * from cgc_forum.topics"),
      /permission denied/,
    );
    await assert.rejects(
      rpc("cgc_forum_moderation_queue"),
      /permission denied/,
    );
    await assert.rejects(
      rpc("cgc_forum_moderate", "'topic',$1,'hide','forged-moderator'", [
        topic,
      ]),
      /permission denied/,
    );
    await assert.rejects(
      rpc("cgc_forum_delete", "'topic',$1", [topic]),
      /cannot remove/,
    );
    let discussion = await rpc<{
      topic: { created_at: string; edited_at: string | null; body: string };
      replies: {
        id: string;
        author_label: string;
        body: string;
        removed: boolean;
      }[];
    }>("cgc_forum_discussion", "$1", [topic]);
    await assert.rejects(
      rpc(
        "cgc_forum_edit",
        "'topic',$1,'Tampered body',$2,'Tampered title',false",
        [topic, discussion.topic.created_at],
      ),
      /cannot edit/,
    );
    const reply = await rpc<{ id: string }>(
      "cgc_forum_create_reply",
      "$1,$2,false",
      [topic, "I can help with the instrument."],
    );
    discussion = await rpc("cgc_forum_discussion", "$1", [topic]);
    assert.equal(discussion.replies[0].author_label, "Bea");
    await rpc("cgc_forum_report", "'topic',$1,$2", [
      topic,
      "Please review this discussion.",
    ]);
    await asUser(alex);
    const version = discussion.topic.created_at;
    await rpc("cgc_forum_edit", "'topic',$1,$2,$3,$4,true", [
      topic,
      "An updated instrument question.",
      version,
      "An updated lab question",
    ]);
    await assert.rejects(
      rpc("cgc_forum_edit", "'topic',$1,$2,$3,$4,true", [
        topic,
        "A stale edit.",
        version,
        "An outdated title",
      ]),
      /post changed/,
    );
    await asModerator();
    const reports = await rpc<
      { id: string; author_email: string; reporter_email: string }[]
    >("cgc_forum_moderation_queue");
    assert.equal(reports[0].author_email, "alex@smu.edu");
    assert.equal(reports[0].reporter_email, "bea@smu.edu");
    await rpc("cgc_forum_handle_report", "$1,'hide','wordpress:1'", [
      reports[0].id,
    ]);
    assert.equal(
      (await rpc<unknown[]>("cgc_forum_moderation_queue")).length,
      0,
    );
    await asUser(bea);
    assert.equal(await rpc("cgc_forum_discussion", "$1", [topic]), null);
    await asModerator();
    await rpc("cgc_forum_moderate", "'topic',$1,'restore','wordpress:1'", [
      topic,
    ]);
    await rpc("cgc_forum_moderate", "'topic',$1,'lock','wordpress:1'", [topic]);
    await asUser(bea);
    await assert.rejects(
      rpc("cgc_forum_create_reply", "$1,'Another reply',true", [topic]),
      /closed/,
    );
    await asModerator();
    await rpc("cgc_forum_moderate", "'topic',$1,'unlock','wordpress:1'", [
      topic,
    ]);
    await rpc("cgc_forum_suspend", "$1,true,'wordpress:1'", [bea]);
    await asUser(bea);
    await assert.rejects(rpc("cgc_forum_feed"), /suspended/);
    await asModerator();
    await rpc("cgc_forum_suspend", "$1,false,'wordpress:1'", [bea]);
    await asUser(bea);
    await rpc("cgc_forum_delete", "'reply',$1", [reply.id]);
    discussion = await rpc("cgc_forum_discussion", "$1", [topic]);
    assert.equal(discussion.replies[0].removed, true);
    assert.equal(discussion.replies[0].author_label, "Removed");
    assert.ok(
      !JSON.stringify(discussion).includes("I can help with the instrument."),
    );
    await db.exec("reset role;delete from cgc_forum.rate_events;");
    await asUser(alex);
    const request = "55555555-5555-4555-8555-555555555555";
    const retryArgs = [topic, "A retry-safe message.", request];
    const posted = await rpc<{ id: string }>(
      "cgc_forum_create_reply",
      "$1,$2,true,$3",
      retryArgs,
    );
    const retried = await rpc<{ id: string }>(
      "cgc_forum_create_reply",
      "$1,$2,true,$3",
      retryArgs,
    );
    assert.equal(posted.id, retried.id, "Retry does not create another reply");
    const topicRequest = "66666666-6666-4666-8666-666666666666";
    const topicArgs = [
      "A retry-safe discussion",
      "A useful question.",
      "general",
      false,
      topicRequest,
    ];
    const postedTopic = await rpc<string>(
      "cgc_forum_create_topic",
      "$1,$2,$3,$4,$5",
      topicArgs,
    );
    assert.equal(
      await rpc<string>("cgc_forum_create_topic", "$1,$2,$3,$4,$5", topicArgs),
      postedTopic,
    );
    await db.exec("reset role;delete from cgc_forum.rate_events;");
    await asUser(alex);
    for (let i = 0; i < 5; i++)
      await rpc("cgc_forum_create_reply", "$1,$2,true", [
        topic,
        `Useful reply ${i}`,
      ]);
    await assert.rejects(
      rpc("cgc_forum_create_reply", "$1,'One too many replies',true", [topic]),
      /Wait a little/,
    );
  } finally {
    await db.close();
  }
});
