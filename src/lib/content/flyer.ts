import { load } from "cheerio";
export function wordpressImage(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "blog.smu.edu" &&
      !url.username &&
      !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function announcementParts(html: string) {
  const $ = load(html, null, false);
  const flyer = wordpressImage(
    $("figure[data-cgc-flyer] img").attr("src") || "",
  );
  const flyerAlt = $("figure[data-cgc-flyer] img").attr("alt") || "Event flyer";
  const rawLink = $("p[data-cgc-registration] a").attr("href") || "";
  let registration: string | undefined;
  try {
    const url = new URL(rawLink);
    if (url.protocol === "https:" && !url.username && !url.password)
      registration = url.href;
  } catch {
    /* Optional link. */
  }
  $(
    "figure[data-cgc-flyer], p[data-cgc-registration], [data-cgc-event], [data-cgc-update]",
  ).remove();
  return { body: $.html(), flyer, flyerAlt, registration };
}
