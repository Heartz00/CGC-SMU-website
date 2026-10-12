import type { Metadata } from "next";
import { AlbumCard } from "@/components/album-card";
import { getWordPressPage } from "@/lib/content/wordpress";
import { parseAlbums } from "@/lib/content/albums";
import { PageIntro } from "@/components/ui";
import { CollectionSearch } from "@/components/collection-search";
export const metadata: Metadata = { title: "Photo albums" };
export const revalidate = 300;
export default async function Photos() {
  let html = "";
  let unavailable = false;
  try {
    html = (await getWordPressPage("cgc-photo-albums")) || "";
  } catch {
    unavailable = true;
  }
  const photos = parseAlbums(html);
  return (
    <>
      <PageIntro label="Our community" title="Moments together.">
        <p>Shared science, celebrations, and life beyond the lab.</p>
      </PageIntro>
      <section className="section container">
        {photos.length ? (
          <CollectionSearch
            label="photos"
            className="album-grid"
            items={photos.map((p, i) => ({
              id: String(i),
              text: `${p.album} ${p.caption} ${p.alt}`,
              group: p.album,
              content: <AlbumCard photo={p} />,
            }))}
          />
        ) : (
          <p>
            {unavailable
              ? "Photo albums are temporarily unavailable. Please try again later."
              : "Photo albums will appear here as the council shares them."}
          </p>
        )}
      </section>
    </>
  );
}
