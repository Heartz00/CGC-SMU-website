import "server-only";
import { load } from "cheerio";
import { wordpressRequest } from "./wordpress";
import type { AdminSession } from "./session-codec";
import type { LibraryImage } from "./image-types";

type Media = {
  id: number;
  source_url: string;
  alt_text?: string;
  title: { rendered: string };
  description?: { rendered: string };
  caption?: { rendered: string };
  media_details?: { sizes?: { thumbnail?: { source_url: string } } };
};
const plain = (html = "") => load(html).text().trim();
export async function imageLibrary(
  session: AdminSession,
): Promise<LibraryImage[]> {
  let totalPages = 1;
  const images: LibraryImage[] = [];
  for (let page = 1; page <= totalPages; page++) {
    const media = await wordpressRequest<Media[]>(session, "media", {
      query: {
        context: "edit",
        media_type: "image",
        per_page: "100",
        page: String(page),
      },
      onHeaders: (headers) => {
        const total = Number(headers.get("x-wp-totalpages"));
        if (Number.isSafeInteger(total) && total > 0) totalPages = total;
      },
    });
    for (const item of media) {
      const title = plain(item.title.rendered) || `Image ${item.id}`;
      const description = [
        item.alt_text,
        plain(item.description?.rendered),
        plain(item.caption?.rendered),
      ]
        .filter(Boolean)
        .join(" ");
      images.push({
        id: item.id,
        url: item.source_url,
        thumbnail:
          item.media_details?.sizes?.thumbnail?.source_url || item.source_url,
        title,
        description,
        searchText: `${title} ${description} ${item.source_url.split("/").pop() || ""}`,
      });
    }
  }
  return images;
}
