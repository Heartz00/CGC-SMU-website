import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  importedAlbumPhotos,
  albumImportVersion,
} from "../src/lib/content/album-import";
import {
  albumImage,
  albumTable,
  parseAlbums,
  resolveAlbums,
} from "../src/lib/content/albums";

test("all supplied ACS photos exist and are grouped without invented dates", () => {
  assert.equal(importedAlbumPhotos.length, 18);
  assert.equal(
    importedAlbumPhotos.filter(
      (p) => p.album === "ACS National Chemistry Week Outreach",
    ).length,
    13,
  );
  assert.equal(
    importedAlbumPhotos.filter((p) => p.album === "ACS Program-in-a-Box")
      .length,
    5,
  );
  assert.equal(new Set(importedAlbumPhotos.map((p) => p.url)).size, 18);
  for (const photo of importedAlbumPhotos) {
    assert.ok(existsSync(path.join(process.cwd(), "public", photo.url)));
    assert.equal(photo.date, "");
    assert.ok(photo.caption && photo.alt);
  }
  assert.deepEqual(
    parseAlbums(albumTable(importedAlbumPhotos)),
    importedAlbumPhotos,
  );
});
test("imported albums merge with existing photos once and respect subsequent removals", () => {
  const existing = {
    album: "Earlier gathering",
    date: "",
    url: "https://blog.smu.edu/chemgrads/files/2026/photo.jpg",
    caption: "An earlier event",
    alt: "Students at a gathering",
  };
  const old = albumTable([existing, importedAlbumPhotos[0]]).replace(
    ` data-cgc-imports="${albumImportVersion}"`,
    "",
  );
  const merged = resolveAlbums(old);
  assert.equal(merged.length, 19);
  assert.ok(merged.some((p) => p.url === existing.url));
  assert.equal(
    merged.filter((p) => p.url === importedAlbumPhotos[0].url).length,
    1,
  );
  assert.deepEqual(resolveAlbums(albumTable([existing])), [existing]);
  assert.deepEqual(resolveAlbums(albumTable([])), []);
  assert.equal(resolveAlbums(null).length, 18);
});
test("only the exact imported photo paths and permitted library images are accepted", () => {
  for (const url of [
    "/photos/2026/unknown.jpg",
    "/photos/2026/../../secret",
    "//outside.example/photo.jpg",
    "https://outside.example/photo.jpg",
    "data:image/svg+xml,anything",
  ])
    assert.equal(albumImage(url), undefined);
});
