"use client";
import { SavedForm } from "./saved-form";
import { ImagePicker } from "./image-picker";
import { SubmitButton } from "./submit";
import { facultyPositions } from "@/lib/content/faculty";
import type { Officer } from "@/lib/content/types";
import { saveFaculty } from "@/app/admin/actions";

export function FacultyEditor({
  initial,
  version,
}: {
  initial: Officer[];
  version: string;
}) {
  return (
    <SavedForm action={saveFaculty} className="admin-editor">
      <input type="hidden" name="version" value={version} />
      <p className="admin-note">
        Shown below the executive council. Leave a profile empty until its
        details are ready.
      </p>
      {facultyPositions.map(({ key, role }) => {
        const person = initial.find((item) => item.role === role);
        return (
          <fieldset className="admin-record" key={key}>
            <legend>{role}</legend>
            <label className="admin-field">
              <span>Full name</span>
              <input
                name={`${key}Name`}
                defaultValue={person?.name || ""}
                maxLength={150}
              />
            </label>
            <label className="admin-field">
              <span>Email</span>
              <input
                name={`${key}Email`}
                type="email"
                defaultValue={person?.email || ""}
                maxLength={254}
              />
            </label>
            <ImagePicker initial={person?.photo || ""} name={`${key}Photo`} />
            <label className="admin-field">
              <span>Biography</span>
              <textarea
                name={`${key}Bio`}
                defaultValue={person?.bio || ""}
                maxLength={5000}
                rows={4}
              />
            </label>
          </fieldset>
        );
      })}
      <SubmitButton label="Save faculty profiles" />
    </SavedForm>
  );
}
