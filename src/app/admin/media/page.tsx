import { SavedForm } from "@/components/admin/saved-form";
import { AdminShell, Field, Notice } from "@/components/admin/shared";
import { SubmitButton } from "@/components/admin/submit";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminError, wordpressRequest } from "@/lib/admin/wordpress";
import { uploadImage } from "../actions";
import { UploadInput } from "@/components/admin/upload-input";
export default async function Media({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { session } = await requireAdmin("upload_files");
  const { notice } = await searchParams;
  let media: { id: number; title: { rendered: string }; source_url: string }[] =
    [];
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
      <div className="admin-list">
        {media.map((image) => (
          <div key={image.id}>
            <strong>{image.title.rendered}</strong>
            <label className="admin-field">
              <span>Image URL</span>
              <input
                readOnly
                value={image.source_url}
                aria-label={`${image.title.rendered} image URL`}
              />
            </label>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
