"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { LibraryImage } from "@/lib/admin/image-types";
import { FieldError, useMarkUnsaved } from "./saved-form";
import { ImageUploadDialog } from "./image-upload-dialog";
let libraryRequest: Promise<LibraryImage[]> | null = null;
function loadImages() {
  if (!libraryRequest)
    libraryRequest = fetch("/admin/api/images", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Photos could not be loaded.");
        return data.images as LibraryImage[];
      })
      .finally(() => {
        libraryRequest = null;
      });
  return libraryRequest;
}
export function ImagePicker({
  initial,
  name = "photo",
  onChange,
  errorName,
}: {
  initial: string;
  name?: string;
  onChange?: () => void;
  errorName?: string;
}) {
  const id = useId();
  const markUnsaved = useMarkUnsaved();
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initial);
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [editor, setEditor] = useState<{ image?: LibraryImage } | null>(null);
  const [limit, setLimit] = useState(24);
  useEffect(() => {
    const form = input.current?.form;
    const restore = (event: Event) => {
      const fields = (event as CustomEvent<Record<string, string>>).detail;
      if (typeof fields?.[name] === "string") setUrl(fields[name]);
    };
    form?.addEventListener("cgc:restore", restore);
    return () => form?.removeEventListener("cgc:restore", restore);
  }, [name]);
  useEffect(() => {
    let active = true;
    loadImages()
      .then((items) => {
        if (active) {
          setImages(items);
          setError("");
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(reason.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [reload]);
  const selected = images.find((image) => image.url === url);
  function choose(value: string) {
    markUnsaved();
    setUrl(value);
    onChange?.();
    requestAnimationFrame(() =>
      input.current?.form?.dispatchEvent(new Event("cgc:changed")),
    );
  }
  return (
    <div className="admin-image-picker">
      <label className="admin-field" htmlFor={`${id}-select`}>
        <span>Choose an existing image</span>
        <select
          id={`${id}-select`}
          value={selected ? String(selected.id) : ""}
          onChange={(event) => {
            const image = images.find(
              (item) => String(item.id) === event.target.value,
            );
            if (image) choose(image.url);
          }}
          disabled={loading || !!error}
        >
          <option value="">
            {loading ? "Loading photos…" : "Select a photo…"}
          </option>
          {images.map((image) => (
            <option key={image.id} value={image.id}>
              {image.title}
              {image.description ? ` — ${image.description.slice(0, 120)}` : ""}
            </option>
          ))}
        </select>
      </label>
      <FieldError name={errorName || name} />
      {error ? (
        <p role="status">{error}</p>
      ) : (
        !loading && (
          <small role="status">
            {images.length} {images.length === 1 ? "photo" : "photos"}.{" "}
            {selected ? `Selected: ${selected.title}.` : ""}
          </small>
        )
      )}
      {selected && (
        <div className="admin-image-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.thumbnail}
            alt={selected.description || selected.title}
            width={100}
            height={100}
          />
        </div>
      )}
      {!loading && !error && images.length > 0 && (
        <details className="admin-image-gallery">
          <summary>Browse thumbnails</summary>
          <div>
            {images.slice(0, limit).map((image) => (
              <button
                type="button"
                key={image.id}
                aria-pressed={url === image.url}
                onClick={() => choose(image.url)}
                title={image.description || image.title}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.thumbnail}
                  alt={image.description || image.title}
                  width={80}
                  height={80}
                  loading="lazy"
                />
                <span>{image.title}</span>
              </button>
            ))}
          </div>
          {images.length > limit && (
            <button
              type="button"
              className="admin-secondary"
              onClick={() => setLimit((value) => value + 24)}
            >
              Load more photos
            </button>
          )}
        </details>
      )}
      <button
        type="button"
        className="admin-secondary"
        onClick={() => {
          libraryRequest = null;
          setLoading(true);
          setError("");
          setReload((value) => value + 1);
        }}
      >
        Refresh photos
      </button>
      <button
        type="button"
        className="admin-secondary"
        onClick={() => setEditor({})}
      >
        Upload a new photo
      </button>
      {selected && (
        <button
          type="button"
          className="admin-secondary"
          onClick={() => setEditor({ image: selected })}
        >
          Adjust / crop selected photo
        </button>
      )}
      {editor && (
        <ImageUploadDialog
          image={editor.image}
          onClose={() => setEditor(null)}
          onUploaded={(image) => {
            const item = {
              ...image,
              thumbnail: image.url,
              description: image.title,
              searchText: image.title,
            };
            setImages((items) => [item, ...items]);
            choose(image.url);
            libraryRequest = null;
            setEditor(null);
          }}
        />
      )}
      <details className="admin-more-options">
        <summary>More options</summary>
        <label className="admin-field" htmlFor={`${id}-url`}>
          <span>Selected photo URL</span>
          <input
            id={`${id}-url`}
            ref={input}
            name={name}
            type="url"
            value={url}
            maxLength={1000}
            onChange={(event) => choose(event.target.value)}
          />
        </label>
      </details>
      {url && (
        <button
          type="button"
          className="admin-remove"
          onClick={() => choose("")}
        >
          Clear photo
        </button>
      )}
    </div>
  );
}
