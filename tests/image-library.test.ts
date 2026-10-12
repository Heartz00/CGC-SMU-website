import test from "node:test";
import assert from "node:assert/strict";
import { imageLibrary } from "../src/lib/admin/image-library";
import { searchImages } from "../src/lib/admin/image-types";

test("image library loads all WordPress pages and searches descriptions, captions, titles and filenames", async () => {
  const originalFetch = global.fetch;
  const pages: string[] = [];
  global.fetch = async (input) => {
    const page = new URL(String(input)).searchParams.get("page") || "1";
    pages.push(page);
    const media =
      page === "1"
        ? [
            {
              id: 1,
              source_url: "https://blog.smu.edu/chemgrads/files/alice.jpg",
              alt_text: "Alice council portrait",
              title: { rendered: "Headshot &amp; portrait" },
              description: { rendered: "<p>Executive committee</p>" },
              caption: { rendered: "<p>President 2026</p>" },
              media_details: {
                sizes: {
                  thumbnail: {
                    source_url:
                      "https://blog.smu.edu/chemgrads/files/alice-small.jpg",
                  },
                },
              },
            },
          ]
        : [
            {
              id: 2,
              source_url: "https://blog.smu.edu/chemgrads/files/bob.png",
              title: { rendered: "Bob" },
            },
          ];
    return new Response(JSON.stringify(media), {
      headers: { "X-WP-TotalPages": "2", "Content-Type": "application/json" },
    });
  };
  try {
    const images = await imageLibrary({
      username: "test",
      password: "test",
      userId: 1,
      expires: Date.now() + 1000,
    });
    assert.deepEqual(pages, ["1", "2"]);
    assert.equal(images[0].title, "Headshot & portrait");
    assert.equal(images[0].thumbnail.endsWith("alice-small.jpg"), true);
    for (const query of [
      "ALICE",
      "executive committee",
      "president 2026",
      "alice.jpg",
      "headshot portrait",
    ])
      assert.deepEqual(
        searchImages(images, query).map((image) => image.id),
        [1],
      );
    assert.equal(searchImages(images, "missing").length, 0);
    assert.equal(searchImages(images, " ").length, 2);
    assert.equal(images[1].thumbnail, images[1].url);
  } finally {
    global.fetch = originalFetch;
  }
});
