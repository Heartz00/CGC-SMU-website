import { SavedForm } from "@/components/admin/saved-form";
import { AdminShell, Field, Notice } from "@/components/admin/shared";
import { SubmitButton } from "@/components/admin/submit";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminError, wordpressRequest } from "@/lib/admin/wordpress";
import { uploadImage } from "../actions";
import { UploadInput } from "@/components/admin/upload-input";
import { MediaLibrary } from "@/components/admin/media-library";
import { load } from "cheerio";
export default async function Media({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { session } = await requireAdmin("upload_files");
  const { notice } = await searchParams;
  let media: {
    id: number;
    title: { rendered: string };
    source_url: string;
    alt_text?: string;
    media_details?: { sizes?: { thumbnail?: { source_url: string } } };
  }[] = [];
  let libraryUnavailable = false;
  try {
    media = await wordpressRequest<typeof media>(session, "media", {
      query: { context: "edit", media_type: "image", per_page: "20" },
    });
  } catch (error) {
    if (!(error instanceof AdminError) || error.kind === "authentication")
      throw error;
    libraryUnavailable = true;
  }
  return (
    <AdminShell
      title="Put a face to the community."
      description="Upload photos and flyers."
    >
      <Notice kind={notice} />
      <SavedForm action={uploadImage} clearOnSuccess className="admin-editor">
        <UploadInput />
        <Field label="Image description" name="alt" maxLength={300} required />
        <SubmitButton label="Upload" pending="Uploading…" />
      </SavedForm>
      <h2 className="admin-subheading">Recent images</h2>
      {libraryUnavailable ? (
        <p className="admin-notice" role="status">
          Could not load recent images. You can still try uploading.
        </p>
      ) : media.length === 0 ? (
        <p>No images have been uploaded yet.</p>
      ) : null}
      <MediaLibrary
        images={media.map((image) => ({
          id: image.id,
          title: load(image.title.rendered).text().trim(),
          url: image.source_url,
          thumbnail:
            image.media_details?.sizes?.thumbnail?.source_url ||
            image.source_url,
          description: image.alt_text || "",
          searchText: image.title.rendered,
        }))}
      />
    </AdminShell>
  );
}
