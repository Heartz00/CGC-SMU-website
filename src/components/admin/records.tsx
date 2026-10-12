"use client";
import { useState, type ReactNode } from "react";
import { RecordPreview } from "./record-preview";
import type { Officer, CouncilEvent } from "@/lib/content/types";
import { SubmitButton } from "./submit";
import { ImagePicker } from "./image-picker";
import { SavedForm, FieldError } from "./saved-form";
import type { SaveResult } from "@/lib/admin/save-result";
import { ncwTemplate } from "@/lib/admin/event-template";
import { eventKey } from "@/lib/content/event-links";
import { dallasLocalTime, dallasToIso } from "@/lib/admin/date-time";
function DallasDateField({
  name,
  initial,
  required,
}: {
  name: string;
  initial: string;
  required?: boolean;
}) {
  const [local, setLocal] = useState(() => dallasLocalTime(initial));
  const [iso, setIso] = useState(initial);
  return (
    <>
      <input
        type="datetime-local"
        data-field-name={name}
        value={local}
        required={required}
        onChange={(event) => {
          const value = event.target.value;
          const converted = dallasToIso(value);
          setLocal(value);
          setIso(converted);
          event.target.setCustomValidity(
            value && !converted
              ? "This time does not exist in Dallas because the clocks change. Choose another time."
              : "",
          );
        }}
      />
      <input type="hidden" name={name} value={iso} />
    </>
  );
}
type Row = Record<string, string>;
type Column = {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  long?: boolean;
  help?: string;
};
export function RecordsEditor({
  kind,
  initial,
  version,
  action,
  children,
  submitLabel,
  hideMemberTerm = false,
}: {
  kind: "officers" | "events";
  initial: Officer[] | CouncilEvent[];
  version: string;
  action: (form: FormData) => Promise<SaveResult>;
  children?: ReactNode;
  submitLabel?: string;
  hideMemberTerm?: boolean;
}) {
  const columns: Column[] =
    kind === "officers"
      ? [
          { name: "name", label: "Full name", required: true },
          { name: "role", label: "Role", required: true },
          { name: "term", label: "Term", help: "For example: 2026–2027" },
          { name: "email", label: "Email", type: "email" },
          {
            name: "photo",
            label: "Photo URL",
            type: "url",
          },
          { name: "bio", label: "Biography", long: true },
        ]
      : [
          { name: "title", label: "Event title", required: true },
          {
            name: "start",
            label: "Start date & time",
            required: true,
            help: "Dallas local time. Daylight-saving offsets are handled automatically.",
          },
          {
            name: "end",
            label: "End date & time",
            help: "Optional; Dallas local time.",
          },
          { name: "location", label: "Location" },
          { name: "registration", label: "Registration URL", type: "url" },
          { name: "flyer", label: "Flyer" },
          { name: "description", label: "Description", long: true },
        ];
  const [rows, setRows] = useState(() =>
    initial.map((row, index) => ({
      key: index,
      data: (kind === "events"
        ? {
            ...row,
            id: (row as CouncilEvent).id || eventKey(row as CouncilEvent),
          }
        : row) as unknown as Row,
    })),
  );
  const [next, setNext] = useState(initial.length);
  return (
    <SavedForm action={action}>
      <input type="hidden" name="version" value={version} />
      {children}
      {rows.map((row, index) => (
        <details
          className="admin-record-group"
          key={row.key}
          open={index === 0}
        >
          <summary>
            {kind === "officers" ? "Officer" : "Event"} {index + 1}
            {row.data.name || row.data.title
              ? ` · ${row.data.name || row.data.title}`
              : ""}
          </summary>
          <fieldset
            className="admin-record"
            key={row.key}
            data-record-index={index}
          >
            {kind === "events" && (
              <input type="hidden" name="eventId" value={row.data.id || ""} />
            )}
            {kind === "officers" && (
              <>
                {hideMemberTerm && <input type="hidden" name="term" value="" />}
                <input
                  type="hidden"
                  name="termStart"
                  value={row.data.termStart || ""}
                />
                <input
                  type="hidden"
                  name="termEnd"
                  value={row.data.termEnd || ""}
                />
              </>
            )}
            <legend>
              {kind === "officers" ? "Officer" : "Event"} {index + 1}
            </legend>
            {kind === "officers" ? (
              <label className="admin-field">
                <span>Portrait framing</span>
                <select
                  name="photoPosition"
                  defaultValue={row.data.photoPosition || "center"}
                >
                  <option value="top">Focus on top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Focus on bottom</option>
                </select>
              </label>
            ) : (
              <label className="admin-field">
                <span>Event status</span>
                <select
                  name="status"
                  defaultValue={row.data.status || "scheduled"}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
            )}
            <div className="admin-fields">
              {columns
                .filter((column) => !(hideMemberTerm && column.name === "term"))
                .map((column) =>
                  ["photo", "flyer"].includes(column.name) ? (
                    <div className="admin-field wide" key={column.name}>
                      <span>
                        {column.name === "photo"
                          ? "Officer photo"
                          : "Event flyer (optional)"}
                      </span>
                      <ImagePicker
                        initial={row.data[column.name] || ""}
                        name={column.name}
                        errorName={`${column.name}:${index}`}
                      />
                    </div>
                  ) : (
                    <label
                      className={`admin-field ${column.long ? "wide" : ""}`}
                      key={column.name}
                    >
                      <span>{column.label}</span>
                      {kind === "events" &&
                      ["start", "end"].includes(column.name) ? (
                        <DallasDateField
                          name={column.name}
                          initial={row.data[column.name] || ""}
                          required={column.required}
                        />
                      ) : column.long ? (
                        <textarea
                          name={column.name}
                          defaultValue={row.data[column.name] || ""}
                          maxLength={5000}
                          rows={4}
                        />
                      ) : (
                        <input
                          name={column.name}
                          type={column.type || "text"}
                          defaultValue={row.data[column.name] || ""}
                          required={column.required}
                          maxLength={
                            column.name === "photo" ||
                            column.name === "registration"
                              ? 1000
                              : column.name === "name" || column.name === "role"
                                ? 150
                                : column.name === "term"
                                  ? 100
                                  : column.name === "email"
                                    ? 254
                                    : column.name === "title"
                                      ? 200
                                      : 300
                          }
                        />
                      )}{" "}
                      {column.help && <small>{column.help}</small>}
                      <FieldError name={`${column.name}:${index}`} />
                    </label>
                  ),
                )}
            </div>
            <button
              type="button"
              className="admin-remove"
              onClick={(event) => {
                if (
                  window.confirm(
                    "Remove this record? Save to apply the change.",
                  )
                ) {
                  event.currentTarget
                    .closest("form")
                    ?.dispatchEvent(new Event("cgc:changed"));
                  setRows((current) =>
                    current.filter((item) => item.key !== row.key),
                  );
                }
              }}
            >
              Remove {kind === "officers" ? "officer" : "event"}
            </button>
          </fieldset>
        </details>
      ))}
      {rows.length === 0 && (
        <p className="admin-empty">No records yet. Add one to get started.</p>
      )}
      <div className="admin-form-actions">
        {kind === "events" && (
          <button
            type="button"
            data-unsaved-change
            className="admin-secondary"
            disabled={rows.length >= 80}
            onClick={() => {
              setRows((current) => [
                ...current,
                {
                  key: next,
                  data: { ...ncwTemplate, id: crypto.randomUUID() },
                },
              ]);
              setNext(next + 1);
            }}
          >
            + ACS NCW example
          </button>
        )}
        <button
          type="button"
          data-unsaved-change
          className="admin-secondary"
          disabled={rows.length >= (kind === "officers" ? 30 : 80)}
          onClick={() => {
            setRows((current) => [
              ...current,
              {
                key: next,
                data:
                  kind === "events"
                    ? { id: crypto.randomUUID() }
                    : {
                        term: rows[0]?.data.term || "",
                        termStart: rows[0]?.data.termStart || "",
                        termEnd: rows[0]?.data.termEnd || "",
                      },
              },
            ]);
            setNext(next + 1);
          }}
        >
          + Add {kind === "officers" ? "officer" : "event"}
        </button>
        <SubmitButton label={submitLabel} />
      </div>
      <RecordPreview kind={kind} />
    </SavedForm>
  );
}
