"use client";
import { useState } from "react";
import { OfficerCard, EventCard } from "@/components/content";
import { Flyer } from "@/components/flyer";
import type { Officer, CouncilEvent } from "@/lib/content/types";
function image(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      u.hostname === "blog.smu.edu" &&
      !u.username &&
      !u.password
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
}
function link(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function RecordPreview({
  kind,
}: {
  kind: "officers" | "events" | "announcement";
}) {
  const [preview, setPreview] = useState<{
    officers: Officer[];
    events: CouncilEvent[];
    title: string;
    body: string;
    flyer?: string;
  } | null>(null);
  const [mobile, setMobile] = useState(false);
  return (
    <div className="admin-preview">
      <button
        className="admin-secondary"
        type="button"
        onClick={(event) => {
          const form = event.currentTarget.closest("form");
          if (!form) return;
          const data = new FormData(form),
            get = (name: string, i = 0) => String(data.getAll(name)[i] || "");
          setPreview({
            officers: data.getAll("name").map((_, i) => ({
              name: get("name", i) || "Member name",
              role: get("role", i) || "Role",
              bio: get("bio", i),
              term: get("councilLabel") || get("term", i),
              photo: image(get("photo", i)),
              photoPosition: ["top", "center", "bottom"].includes(
                get("photoPosition", i),
              )
                ? (get("photoPosition", i) as Officer["photoPosition"])
                : undefined,
              email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get("email", i))
                ? get("email", i)
                : undefined,
            })),
            events: data
              .getAll("title")
              .map((_, i) => ({
                title: get("title", i),
                start: get("start", i),
                location: get("location", i),
                description: get("description", i),
                flyer: image(get("flyer", i)),
                status: ["scheduled", "cancelled", "rescheduled"].includes(
                  get("status", i),
                )
                  ? (get("status", i) as CouncilEvent["status"])
                  : undefined,
                end: Number.isFinite(Date.parse(get("end", i)))
                  ? get("end", i)
                  : undefined,
                registration: link(get("registration", i)),
              }))
              .filter((e) => e.title && Number.isFinite(Date.parse(e.start))),
            title: get("title"),
            body: get("body"),
            flyer: image(get("flyer")),
          });
        }}
      >
        Preview changes
      </button>
      {preview && (
        <section aria-label="Content preview">
          <div className="admin-form-actions">
            <strong>Preview</strong>
            <button
              className="admin-secondary"
              type="button"
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? "Desktop view" : "Phone view"}
            </button>
            <button
              className="admin-secondary"
              type="button"
              onClick={() => setPreview(null)}
            >
              Close preview
            </button>
          </div>
          <p className="admin-note">
            Preview shows your entries when opened. Reopen it after editing.
          </p>
          <div className={`admin-record-preview ${mobile ? "phone" : ""}`}>
            {kind === "officers" &&
              (preview.officers.length ? (
                <div className="officers-grid">
                  {preview.officers.map((o, i) => (
                    <OfficerCard key={i} officer={o} />
                  ))}
                </div>
              ) : (
                <p>Add a member to preview.</p>
              ))}
            {kind === "events" &&
              (preview.events.length ? (
                <div className="events-list">
                  {preview.events.map((e, i) => (
                    <EventCard key={i} event={e} />
                  ))}
                </div>
              ) : (
                <p>Enter an event title and valid date to preview.</p>
              ))}
            {kind === "announcement" && (
              <article className="prose">
                {preview.flyer && (
                  <Flyer src={preview.flyer} alt={`${preview.title} flyer`} />
                )}
                <h2>{preview.title || "Announcement title"}</h2>
                {preview.body.split(/\n\s*\n/).map((p, i) => (
                  <p key={i} style={{ whiteSpace: "pre-wrap" }}>
                    {p}
                  </p>
                ))}
              </article>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
