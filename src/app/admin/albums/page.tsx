import { AdminShell } from "@/components/admin/shared";
import { AlbumEditor } from "@/components/admin/album-editor";
import { requireAdmin } from "@/lib/admin/auth";
import { editablePage } from "@/lib/admin/wordpress";
import { parseAlbums } from "@/lib/content/albums";
import { saveAlbums } from "../actions";
export default async function Albums() {
  const { session } = await requireAdmin("publish_pages");
  const page = await editablePage(session, "cgc-photo-albums");
  return (
    <AdminShell
      title="Life beyond the lab."
      description="Group photos by album and add captions and image descriptions."
    >
      <p>
        <a
          className="text-link"
          href="/photos"
          target="_blank"
          rel="noopener noreferrer"
        >
          View photo albums
        </a>
      </p>
      <AlbumEditor
        initial={parseAlbums(page?.content.rendered || "")}
        version={page?.modified_gmt || "new"}
        action={saveAlbums}
      />
    </AdminShell>
  );
}
