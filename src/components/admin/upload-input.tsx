"use client";
import { useEffect, useRef, useState } from "react";
import { prepareImage } from "@/lib/admin/prepare-image";
import { FieldError, useMarkUnsaved } from "./saved-form";
import { ImageCropper } from "./image-cropper";
export function UploadInput() {
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState("");
  const [original, setOriginal] = useState<File | null>(null);
  const [editing, setEditing] = useState(false);
  const markUnsaved = useMarkUnsaved();
  const sequence = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const form = inputRef.current?.form;
    const clear = () => {
      sequence.current++;
      setPreview("");
      setMessage("");
      setOriginal(null);
      setEditing(false);
      inputRef.current?.setCustomValidity("");
    };
    form?.addEventListener("cgc:saved", clear);
    return () => form?.removeEventListener("cgc:saved", clear);
  }, []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  function applyImage(file: File) {
    const input = inputRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.setCustomValidity("");
    setPreview(URL.createObjectURL(file));
    setMessage(`${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    setEditing(false);
    markUnsaved();
  }
  return (
    <div>
      <label className="admin-field">
        <span>Photo or flyer</span>
        <input
          name="image"
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          required
          onChange={async (event) => {
            const input = event.currentTarget;
            const current = ++sequence.current;
            const file = input.files?.[0];
            setPreview("");
            setOriginal(null);
            setEditing(false);
            if (!file) {
              input.setCustomValidity("");
              setMessage("");
              return;
            }
            input.setCustomValidity("Preparing image. Please wait.");
            setMessage("Preparing image…");
            try {
              if (
                file.type &&
                ![
                  "image/jpeg",
                  "image/png",
                  "image/webp",
                  "application/octet-stream",
                ].includes(file.type)
              )
                throw new Error("Choose a JPEG, PNG, or WebP image.");
              const ready = await prepareImage(file);
              if (current !== sequence.current) return;
              const transfer = new DataTransfer();
              transfer.items.add(ready);
              input.files = transfer.files;
              input.setCustomValidity("");
              setPreview(URL.createObjectURL(ready));
              setOriginal(ready);
              setMessage(
                `${ready.name} · ${(ready.size / 1024 / 1024).toFixed(2)} MB${ready !== file ? " · Resized automatically" : ""}`,
              );
            } catch (error) {
              if (current !== sequence.current) return;
              const message =
                error instanceof Error
                  ? error.message
                  : "Could not prepare this image.";
              input.setCustomValidity(message);
              setMessage(message);
            }
          }}
        />
        <small>
          JPEG, PNG, or WebP. Large images are resized automatically.
        </small>
        {message && <small role="status">{message}</small>}
        <FieldError name="image" />
      </label>
      {preview && (
        <div className="admin-image-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Selected upload preview"
            width={140}
            height={140}
          />
        </div>
      )}
      {original && !editing && (
        <div className="admin-crop-actions">
          <button
            type="button"
            className="admin-secondary"
            onClick={() => {
              inputRef.current?.setCustomValidity(
                "Apply or cancel the crop before uploading.",
              );
              setEditing(true);
            }}
          >
            Adjust / crop
          </button>
          <button
            type="button"
            className="admin-secondary"
            onClick={() => applyImage(original)}
          >
            Use original
          </button>
        </div>
      )}
      {original && editing && (
        <ImageCropper
          file={original}
          onApply={applyImage}
          onCancel={() => {
            inputRef.current?.setCustomValidity("");
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
