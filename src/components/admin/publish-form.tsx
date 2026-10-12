"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { publishUpdate } from "@/app/admin/actions";
import { ImagePicker } from "./image-picker";
import { PublishingSchedule } from "./publishing-schedule";
import { EventCard } from "@/components/content";
import { Flyer } from "@/components/flyer";
import { dallasLocalTime, dallasToIso } from "@/lib/admin/date-time";
import type { CouncilEvent } from "@/lib/content/types";
import type { PublishResult } from "@/lib/admin/publishing";
import { DraftRecovery } from "./draft-recovery";
import type { DraftFields } from "@/lib/admin/content-draft";
type Initial = {
  title: string;
  body: string;
  flyer: string;
  registration: string;
  event?: CouncilEvent;
  postId?: number;
  version?: string;
  status?: string;
  publishAt?: string;
};
export function PublishForm({
  initial,
  canPublish,
  canCalendar,
  draftKey,
}: {
  initial: Initial;
  canPublish: boolean;
  canCalendar: boolean;
  draftKey?: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(publishUpdate, {
    message: "",
    postId: initial.postId,
    version: initial.version,
  } as PublishResult);
  const form = useRef<HTMLFormElement>(null);
  const [calendar, setCalendar] = useState(!!initial.event);
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState(
    initial.status === "future"
      ? "future"
      : initial.status === "publish"
        ? "publish"
        : "draft",
  );
  const [fieldError, setFieldError] = useState("");
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [registration, setRegistration] = useState(initial.registration);
  const [location, setLocation] = useState(initial.event?.location || "");
  const [snapshot, setSnapshot] = useState<
    (Initial & { event?: CouncilEvent }) | null
  >(null);
  const [mobile, setMobile] = useState(false);
  const [recovered, setRecovered] = useState<DraftFields | null>(null);
  const [savedAt, setSavedAt] = useState("");
  useEffect(() => {
    if (!state.success) return;
    const frame = requestAnimationFrame(() =>
      setSavedAt(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      ),
    );
    return () => cancelAnimationFrame(frame);
  }, [state]);
  useEffect(() => {
    if (state.success && state.postId && !initial.postId)
      router.replace(`/admin/publish?post=${state.postId}&saved=1`);
  }, [state, initial.postId, router]);
  const unsaved = dirty || (!!state.message && !state.success);
  useEffect(() => {
    if (!unsaved || pending) return;
    function unload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    function navigate(event: MouseEvent) {
      const link = (event.target as Element).closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !link ||
        link.target === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        link.getAttribute("href")?.startsWith("#")
      )
        return;
      if (!window.confirm("Leave this page without saving your changes?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [unsaved, pending]);
  function preview() {
    if (!form.current?.reportValidity()) return;
    const data = new FormData(form.current);
    const value = (name: string) => String(data.get(name) || "");
    const event = calendar
      ? {
          title: value("title"),
          description: value("body"),
          location: value("location"),
          start: value("start"),
          end: value("end"),
          flyer: value("flyer"),
          registration: value("registration"),
        }
      : undefined;
    setSnapshot({
      title: value("title"),
      body: value("body"),
      flyer: value("flyer"),
      registration: value("registration"),
      event,
    });
  }
  return (
    <>
      <form
        ref={form}
        action={action}
        onSubmit={() => setDirty(false)}
        onChange={() => {
          setDirty(true);
          setFieldError("");
        }}
        onInvalidCapture={(event) => {
          const input = event.target as HTMLInputElement;
          for (
            let parent = input.parentElement;
            parent && parent !== event.currentTarget;
            parent = parent.parentElement
          ) {
            if (parent instanceof HTMLDetailsElement) parent.open = true;
          }
          const label =
            input.closest("label")?.querySelector("span")?.textContent ||
            "Required field";
          setFieldError(`${label}: ${input.validationMessage}`);
        }}
        className="admin-editor"
        aria-busy={pending}
      >
        {draftKey && (
          <DraftRecovery
            storageKey={draftKey}
            form={form}
            result={state}
            onRestore={(fields) => {
              setTitle(fields.title || "");
              setBody(fields.body || "");
              setRegistration(fields.registration || "");
              setLocation(fields.location || "");
              setCalendar(canCalendar && fields.calendar === "on");
              setRecovered(fields);
              setPublishing("draft");
              setDirty(true);
            }}
          />
        )}
        <fieldset className="admin-form-fields" disabled={pending}>
          <input type="hidden" name="postId" value={state.postId || ""} />
          <input type="hidden" name="version" value={state.version || "new"} />
          <label className="admin-field">
            <span>Title</span>
            <input
              name="title"
              required
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={!!state.fields?.title}
              aria-describedby={
                state.fields?.title ? "publish-title-error" : undefined
              }
            />
            {state.fields?.title && (
              <span id="publish-title-error" className="admin-field-error">
                {state.fields.title}
              </span>
            )}
          </label>
          <label className="admin-field">
            <span>Description</span>
            <textarea
              name="body"
              required
              maxLength={calendar ? 5000 : 50000}
              rows={7}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              aria-invalid={!!state.fields?.body}
              aria-describedby={
                state.fields?.body ? "publish-body-error" : undefined
              }
            />
            {state.fields?.body && (
              <span id="publish-body-error" className="admin-field-error">
                {state.fields.body}
              </span>
            )}
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              name="calendar"
              checked={calendar}
              disabled={!canCalendar}
              onChange={(event) => setCalendar(event.target.checked)}
            />
            <span>Also show in Upcoming Events</span>
          </label>
          {calendar && (
            <div className="admin-fields">
              <LocalDate
                name="start"
                label="Start · Dallas time"
                initial={initial.event?.start || ""}
                key={`start-${recovered?.start || "initial"}`}
                recovered={recovered?.start}
                required
                error={state.fields?.start}
              />
              <LocalDate
                name="end"
                label="End · Dallas time (optional)"
                initial={initial.event?.end || ""}
                key={`end-${recovered?.end || "initial"}`}
                recovered={recovered?.end}
                error={state.fields?.end}
              />
              <label className="admin-field wide">
                <span>Location</span>
                <input
                  name="location"
                  required
                  maxLength={300}
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  aria-invalid={!!state.fields?.location}
                />
                {state.fields?.location && (
                  <span className="admin-field-error">
                    {state.fields.location}
                  </span>
                )}
              </label>
            </div>
          )}
          <details className="admin-more-options">
            <summary>Image and registration (optional)</summary>
            <div className="admin-field">
              <span>Flyer (optional)</span>
              <ImagePicker
                initial={recovered?.flyer ?? initial.flyer}
                key={recovered ? `recovered-${recovered.flyer}` : "initial"}
                name="flyer"
                onChange={() => setDirty(true)}
              />
              {state.fields?.flyer && (
                <span className="admin-field-error">{state.fields.flyer}</span>
              )}
            </div>
            <label className="admin-field">
              <span>Registration link (optional)</span>
              <input
                name="registration"
                type="url"
                maxLength={1000}
                value={registration}
                onChange={(event) => setRegistration(event.target.value)}
                aria-invalid={!!state.fields?.registration}
              />
              {state.fields?.registration && (
                <span className="admin-field-error">
                  {state.fields.registration}
                </span>
              )}
            </label>
          </details>
          <label className="admin-field">
            <span>Publishing</span>
            <select
              name="status"
              value={publishing}
              onChange={(event) => setPublishing(event.target.value)}
            >
              <option value="draft">Save draft</option>
              {canPublish && <option value="publish">Publish</option>}
              {canPublish && (
                <option value="future">Schedule publication</option>
              )}
            </select>
          </label>
          <PublishingSchedule initial={initial.publishAt} />
          <p className="admin-save-status" role="status">
            {pending
              ? "Saving…"
              : dirty
                ? "Unsaved changes"
                : savedAt
                  ? `Saved at ${savedAt}`
                  : ""}
          </p>
          <div className="admin-form-actions">
            <Link href="/admin/announcements" className="admin-secondary">
              Cancel
            </Link>
            <button type="button" className="admin-secondary" onClick={preview}>
              Preview
            </button>
            <button type="submit" className="button" disabled={pending}>
              {pending
                ? "Saving…"
                : publishing === "future"
                  ? "Schedule update"
                  : publishing === "publish"
                    ? "Publish update"
                    : "Save draft"}
            </button>
            <span role="status">
              {pending ? "Saving…" : dirty ? "Unsaved changes" : state.message}
            </span>
          </div>
        </fieldset>
        {fieldError && (
          <p className="admin-notice" role="alert">
            {fieldError}
          </p>
        )}
        {state.message && (
          <div
            className={`admin-notice ${state.success ? "success" : ""}`}
            role="status"
          >
            <p>{state.message}</p>
            {state.links?.map((link) => (
              <p key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label} ↗
                </a>
              </p>
            ))}
          </div>
        )}
      </form>
      {snapshot && (
        <section className="admin-preview" aria-label="Publication preview">
          <div className="admin-form-actions">
            <strong>Preview</strong>
            <button
              type="button"
              className="admin-secondary"
              aria-pressed={!mobile}
              onClick={() => setMobile(false)}
            >
              Desktop
            </button>
            <button
              type="button"
              className="admin-secondary"
              aria-pressed={mobile}
              onClick={() => setMobile(true)}
            >
              Mobile
            </button>
            <button
              type="button"
              className="admin-secondary"
              onClick={() => setSnapshot(null)}
            >
              Close
            </button>
          </div>
          <div className={`admin-preview-frame ${mobile ? "is-mobile" : ""}`}>
            <h2>{snapshot.title}</h2>
            {snapshot.event ? (
              <EventCard event={snapshot.event} />
            ) : (
              <>
                <p style={{ whiteSpace: "pre-line" }}>{snapshot.body}</p>
                {snapshot.flyer && (
                  <Flyer src={snapshot.flyer} alt={`${snapshot.title} flyer`} />
                )}
                {snapshot.registration && (
                  <a
                    href={snapshot.registration}
                    className="button"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Registration & details
                  </a>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
}
function LocalDate({
  name,
  label,
  initial,
  required,
  error,
  recovered,
}: {
  name: string;
  label: string;
  initial: string;
  required?: boolean;
  error?: string;
  recovered?: string;
}) {
  const [local, setLocal] = useState(() =>
    dallasLocalTime(recovered ?? initial),
  );
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input
        type="datetime-local"
        value={local}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `publish-${name}-error` : undefined}
        onChange={(event) => {
          setLocal(event.target.value);
          event.target.setCustomValidity(
            event.target.value && !dallasToIso(event.target.value)
              ? "Choose a valid Dallas time."
              : "",
          );
        }}
      />
      {error && (
        <span id={`publish-${name}-error`} className="admin-field-error">
          {error}
        </span>
      )}
      <input
        type="hidden"
        name={name}
        value={local ? dallasToIso(local) : ""}
      />
    </label>
  );
}
