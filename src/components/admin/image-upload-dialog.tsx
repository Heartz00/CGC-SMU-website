"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { uploadImage } from "@/app/admin/actions";
import type { LibraryImage } from "@/lib/admin/image-types";
import { SavedForm } from "./saved-form";
import { UploadInput } from "./upload-input";
import { SubmitButton } from "./submit";

export function ImageUploadDialog({
  image,
  onClose,
  onUploaded,
}: {
  image?: LibraryImage;
  onClose: () => void;
  onUploaded: (
    image: NonNullable<Awaited<ReturnType<typeof uploadImage>>["image"]>,
  ) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const dirty = useRef(false);
  const [file, setFile] = useState<File>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      node?.close();
      document.body.style.overflow = before;
    };
  }, []);
  useEffect(() => {
    if (!image) return;
    const controller = new AbortController();
    fetch(`/admin/api/images/${image.id}/file`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Could not open this image.");
        }
        const blob = await response.blob();
        if (!controller.signal.aborted)
          setFile(
            new File(
              [blob],
              `${image.title.replace(/[^\w.-]/g, "_") || "photo"}.${blob.type === "image/jpeg" ? "jpg" : blob.type === "image/png" ? "png" : "webp"}`,
              { type: blob.type },
            ),
          );
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not open this image.",
          );
      });
    return () => controller.abort();
  }, [image]);
  function close() {
    if (dialog.current?.querySelector('form[aria-busy="true"]')) return;
    if (dirty.current && !window.confirm("Discard this unfinished upload?"))
      return;
    onClose();
  }
  return createPortal(
    <dialog
      className="image-upload-dialog"
      ref={dialog}
      aria-labelledby="upload-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onChangeCapture={() => {
        dirty.current = true;
      }}
    >
      <div className="dialog-heading">
        <h2 id="upload-dialog-title">
          {image ? "Crop a copy" : "Upload a photo"}
        </h2>
        <button
          type="button"
          className="admin-secondary"
          onClick={close}
          disabled={busy}
        >
          Close
        </button>
      </div>
      {image && <p>Your original photo stays unchanged.</p>}
      {error ? (
        <p role="alert">{error}</p>
      ) : image && !file ? (
        <p role="status">Opening image…</p>
      ) : (
        <SavedForm
          action={uploadImage}
          clearOnSuccess
          className="admin-editor"
          onPendingChange={setBusy}
          onSaved={(result) => {
            if (result.image) onUploaded(result.image);
          }}
        >
          <UploadInput initialFile={file} startEditing={!!image} />
          <label className="admin-field">
            <span>Image description</span>
            <input
              name="alt"
              defaultValue={(image?.description || image?.title || "").slice(
                0,
                300,
              )}
              required
              maxLength={300}
            />
          </label>
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary" onClick={close}>
              Cancel
            </button>
            <SubmitButton
              label="Upload & select"
              pending="Uploading…"
              cancel={false}
            />
          </div>
        </SavedForm>
      )}
    </dialog>,
    document.body,
  );
}
