"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LibraryImage } from "@/lib/admin/image-types";
import { ImageUploadDialog } from "./image-upload-dialog";
export function MediaLibrary({ images }: { images: LibraryImage[] }) {
  const [selected, setSelected] = useState<LibraryImage>();
  const router = useRouter();
  return (
    <>
      <div className="admin-media-grid">
        {images.map((image) => (
          <article key={image.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.thumbnail}
              alt={image.description || image.title}
              width={220}
              height={160}
              loading="lazy"
            />
            <strong>{image.title}</strong>
            <button
              type="button"
              className="admin-secondary"
              onClick={() => setSelected(image)}
            >
              Adjust / crop
            </button>
            <details>
              <summary>Image URL</summary>
              <input
                readOnly
                value={image.url}
                aria-label={`${image.title} image URL`}
              />
            </details>
          </article>
        ))}
      </div>
      {selected && (
        <ImageUploadDialog
          image={selected}
          onClose={() => setSelected(undefined)}
          onUploaded={() => {
            setSelected(undefined);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
