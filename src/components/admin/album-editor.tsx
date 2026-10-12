"use client";
import { useState } from "react";
import { SavedForm } from "./saved-form";
import { ImagePicker } from "./image-picker";
import { SubmitButton } from "./submit";
import type { AlbumPhoto } from "@/lib/content/albums";
import type { SaveResult } from "@/lib/admin/save-result";
export function AlbumEditor({
  initial,
  version,
  action,
}: {
  initial: AlbumPhoto[];
  version: string;
  action: (form: FormData) => Promise<SaveResult>;
}) {
  const [rows, setRows] = useState(
      initial.map((photo, i) => ({ key: i, photo })),
    ),
    [next, setNext] = useState(initial.length);
  return (
    <SavedForm action={action}>
      <input type="hidden" name="version" value={version} />
      {rows.map(({ key, photo }, i) => (
        <details className="admin-record-group" key={key} open={i === 0}>
          <summary>
            {photo.album || "New photo"} · {i + 1}
          </summary>
          <div className="admin-editor">
            {[
              {
                name: "album",
                label: "Album name",
                value: photo.album,
                required: true,
              },
              {
                name: "date",
                label: "Event date",
                value: photo.date,
                type: "date",
              },
              { name: "caption", label: "Caption", value: photo.caption },
              {
                name: "alt",
                label: "Image description",
                value: photo.alt,
                required: true,
              },
            ].map((f) => (
              <label className="admin-field" key={f.name}>
                <span>{f.label}</span>
                <input
                  name={f.name}
                  defaultValue={f.value}
                  type={f.type || "text"}
                  required={f.required}
                  maxLength={300}
                />
              </label>
            ))}
            <ImagePicker name="photo" initial={photo.url} />
            <button
              type="button"
              className="admin-remove"
              onClick={(e) => {
                if (!window.confirm("Remove this photo? Save to apply."))
                  return;
                e.currentTarget
                  .closest("form")
                  ?.dispatchEvent(new Event("cgc:changed"));
                setRows((r) => r.filter((row) => row.key !== key));
              }}
            >
              Remove photo
            </button>
          </div>
        </details>
      ))}
      <div className="admin-form-actions">
        <button
          className="admin-secondary"
          data-unsaved-change
          type="button"
          disabled={rows.length >= 100}
          onClick={() => {
            setRows((r) => [
              ...r,
              {
                key: next,
                photo: {
                  album: r[0]?.photo.album || "",
                  date: r[0]?.photo.date || "",
                  url: "",
                  caption: "",
                  alt: "",
                },
              },
            ]);
            setNext(next + 1);
          }}
        >
          Add photo
        </button>
        <SubmitButton />
      </div>
    </SavedForm>
  );
}
