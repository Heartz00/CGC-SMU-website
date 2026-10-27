import { load } from "cheerio";
import { wordpressImage } from "./flyer";
import {
  albumImportVersion,
  importedAlbumPhotos,
  isImportedAlbumPhoto,
} from "./album-import";
export type AlbumPhoto = {
  album: string;
  date: string;
  url: string;
  caption: string;
  alt: string;
};
export function albumImage(value: string) {
  return isImportedAlbumPhoto(value) ? value : wordpressImage(value);
}
export function resolveAlbums(html: string | null): AlbumPhoto[] {
  const managed = parseAlbums(html || "");
  const $ = load(html || "");
  if ($(`table[data-cgc-imports="${albumImportVersion}"]`).length)
    return managed;
  const existing = new Set(managed.map((photo) => photo.url));
  return [
    ...importedAlbumPhotos.filter((photo) => !existing.has(photo.url)),
    ...managed,
  ];
}
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function albumTable(photos: AlbumPhoto[]) {
  return `<table data-cgc-imports="${albumImportVersion}"><thead><tr>${["Album", "Date", "Photo", "Caption", "Alt"].map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${photos.map((p) => `<tr>${[p.album, p.date, p.url, p.caption, p.alt].map((v) => `<td>${escape(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
export function parseAlbums(html: string): AlbumPhoto[] {
  const $ = load(html),
    photos: AlbumPhoto[] = [];
  $("table").each((_, table) => {
    const rows = $(table).find("tr").toArray(),
      headers = $(rows[0])
        .find("th,td")
        .toArray()
        .map((c) => $(c).text().trim());
    if (!["Album", "Photo", "Alt"].every((h) => headers.includes(h))) return;
    for (const row of rows.slice(1)) {
      const cells = $(row).find("td"),
        get = (h: string) =>
          headers.includes(h) ? cells.eq(headers.indexOf(h)).text().trim() : "",
        url = albumImage(get("Photo"));
      if (url && get("Album") && get("Alt"))
        photos.push({
          album: get("Album"),
          date: get("Date"),
          url,
          caption: get("Caption"),
          alt: get("Alt"),
        });
    }
  });
  return photos;
}
