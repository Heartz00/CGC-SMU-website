import { AdminShell, Field } from "@/components/admin/shared";
import { SavedForm, FieldError } from "@/components/admin/saved-form";
import { SubmitButton } from "@/components/admin/submit";
import { requireAdmin } from "@/lib/admin/auth";
import { editablePage } from "@/lib/admin/wordpress";
import { parseOfficers } from "@/lib/content/adapters";
import { parseCouncilHistory } from "@/lib/content/council-history";
import { archiveCouncil, saveCouncilTerm, undoArchive } from "../actions";
import Link from "next/link";
export default async function Handover() {
  const { session } = await requireAdmin("publish_pages");
  const [roster, history] = await Promise.all([
    editablePage(
      session,
      process.env.WORDPRESS_MANAGED_OFFICERS_SLUG || "cgc-officers",
    ),
    editablePage(session, "cgc-council-history"),
  ]);
  const members = parseOfficers(roster?.content.rendered || "");
  const current = members[0];
  const terms = parseCouncilHistory(history?.content.rendered || "");
  return (
    <AdminShell
      title="A smooth handover."
      description="Manage the current term and previous councils."
    >
      <h2>Set the current term</h2>
      <SavedForm action={saveCouncilTerm} className="admin-editor">
        <input
          type="hidden"
          name="version"
          value={roster?.modified_gmt || "new"}
        />
        <Field
          name="label"
          label="Term name"
          value={current?.term || ""}
          required
          maxLength={100}
        />
        <div className="admin-fields">
          <Field
            name="start"
            label="Term start"
            type="date"
            value={current?.termStart || ""}
            required
          />
          <Field
            name="end"
            label="Term end"
            type="date"
            value={current?.termEnd || ""}
            required
          />
        </div>
        <SubmitButton label="Save term" />
      </SavedForm>
      <details className="admin-editor">
        <summary>Archive the outgoing council</summary>
        <p className="admin-note">
          This copies the members below into Council history. To add an older
          council with different members, do not archive this roster.
        </p>
        <ul>
          {members.map((member) => (
            <li key={`${member.name}-${member.role}`}>
              {member.name} — {member.role}
            </li>
          ))}
        </ul>
        <SavedForm action={archiveCouncil} className="admin-editor">
          <input
            type="hidden"
            name="version"
            value={history?.modified_gmt || "new"}
          />
          <input
            type="hidden"
            name="rosterVersion"
            value={roster?.modified_gmt || "new"}
          />
          <Field
            name="label"
            label="Term name"
            value={current?.term || ""}
            required
            maxLength={100}
          />
          <div className="admin-fields">
            <Field
              name="start"
              label="Term start"
              type="date"
              value={current?.termStart || ""}
              required
            />
            <Field
              name="end"
              label="Term end"
              type="date"
              value={current?.termEnd || ""}
              required
            />
          </div>
          <p className="admin-note">
            Publishes a snapshot in Council history. The current roster stays in
            place.
          </p>
          <label className="admin-check">
            <input type="checkbox" name="confirmArchive" required />
            <span>
              These members are the outgoing council for this term.
              <FieldError name="confirmArchive" />
            </span>
          </label>
          <SubmitButton label="Archive council" />
        </SavedForm>
      </details>
      <h2 className="admin-subheading">Archived terms</h2>
      <p>
        <Link className="button outline" href="/admin/handover/add">
          Add past council
        </Link>
      </p>
      {terms.length > 0 && (
        <p className="admin-note">
          Undo archive removes that history entry only. Your current officers
          stay in place.
        </p>
      )}
      {terms.length ? (
        <div className="admin-list">
          {terms.map((term) => (
            <div key={term.id}>
              <a href={`/executive-committee/history#${term.id}`}>
                <strong>{term.label}</strong>
                <span>
                  {term.officers.length} members · {term.start} – {term.end}
                </span>
              </a>
              <SavedForm action={undoArchive}>
                <input
                  type="hidden"
                  name="version"
                  value={history?.modified_gmt || "new"}
                />
                <input type="hidden" name="termId" value={term.id} />
                <SubmitButton label={`Undo archive: ${term.label}`} secondary />
              </SavedForm>
            </div>
          ))}
        </div>
      ) : (
        <p>No archived councils yet.</p>
      )}
    </AdminShell>
  );
}
