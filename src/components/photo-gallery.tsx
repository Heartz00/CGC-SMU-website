"use client";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { AlbumPhoto } from "@/lib/content/albums";

export function PhotoGallery({ photos }: { photos: AlbumPhoto[] }) {
  const [query, setQuery] = useState("");
  const [album, setAlbum] = useState("");
  const [limit, setLimit] = useState(12);
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const id = useId();
  const filtered = photos.filter(
    (photo) =>
      (!album || photo.album === album) &&
      `${photo.album} ${photo.caption} ${photo.alt}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const current = active === null ? null : filtered[active];
  const isOpen = !!current;
  useEffect(() => {
    const node = dialog.current;
    if (!isOpen) {
      node?.close();
      return;
    }
    node?.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      node?.close();
      document.body.style.overflow = before;
    };
  }, [isOpen]);
  function move(step: number) {
    setActive((value) =>
      value === null
        ? null
        : (value + step + filtered.length) % filtered.length,
    );
  }
  return (
    <>
      <div className="collection-controls">
        <label htmlFor={id}>
          Search photos
          <input
            type="search"
            id={id}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(12);
            }}
            placeholder="Search photos"
          />
        </label>
        <label>
          Album
          <select
            value={album}
            onChange={(event) => {
              setAlbum(event.target.value);
              setLimit(12);
            }}
          >
            <option value="">All albums</option>
            {[...new Set(photos.map((photo) => photo.album))].map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p role="status" className="section-note">
        Showing {Math.min(limit, filtered.length)} of {filtered.length} photos
      </p>
      <div className="album-grid">
        {filtered.slice(0, limit).map((photo, index) => (
          <figure className="album-photo" key={`${photo.url}-${index}`}>
            <button
              type="button"
              className="gallery-photo-button"
              aria-label={`View photo: ${photo.alt}`}
              onClick={() => setActive(index)}
            >
              <Image
                src={photo.url}
                alt={photo.alt}
                width={1000}
                height={750}
                sizes="(max-width:640px) 90vw, 45vw"
              />
            </button>
            <figcaption>
              <strong>{photo.album}</strong>
              {photo.date && <p>{photo.date}</p>}
              {photo.caption && <p>{photo.caption}</p>}
            </figcaption>
          </figure>
        ))}
      </div>
      {!filtered.length && <p>No matches. Try another search or album.</p>}
      {filtered.length > limit && (
        <button
          type="button"
          className="button secondary gallery-load-more"
          onClick={() => setLimit((value) => value + 12)}
        >
          Load more photos
        </button>
      )}
      <dialog
        ref={dialog}
        className="photo-lightbox"
        aria-labelledby={`${id}-caption`}
        onCancel={(event) => {
          event.preventDefault();
          setActive(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
        }}
      >
        {current && (
          <>
            <div className="lightbox-toolbar">
              <span>
                {(active || 0) + 1} / {filtered.length}
              </span>
              <button type="button" onClick={() => setActive(null)}>
                Close
              </button>
            </div>
            <div
              className="lightbox-image"
              onTouchStart={(event) => {
                touch.current = {
                  x: event.touches[0].clientX,
                  y: event.touches[0].clientY,
                };
              }}
              onTouchEnd={(event) => {
                if (!touch.current) return;
                const dx = event.changedTouches[0].clientX - touch.current.x;
                const dy = event.changedTouches[0].clientY - touch.current.y;
                if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy))
                  move(dx < 0 ? 1 : -1);
                touch.current = null;
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.url} alt={current.alt} />
            </div>
            <p id={`${id}-caption`}>
              {current.caption || current.alt} · {current.album}
            </p>
            <div className="lightbox-toolbar">
              <button
                type="button"
                disabled={filtered.length < 2}
                onClick={() => move(-1)}
              >
                Previous
              </button>
              <a href={current.url} target="_blank" rel="noopener noreferrer">
                Open full image ↗
              </a>
              <button
                type="button"
                disabled={filtered.length < 2}
                onClick={() => move(1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
