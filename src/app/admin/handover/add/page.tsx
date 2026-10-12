import { AdminShell, Field } from "@/components/admin/shared";
import { RecordsEditor } from "@/components/admin/records";
import { requireAdmin } from "@/lib/admin/auth";
import { editablePage } from "@/lib/admin/wordpress";
import { savePastCouncil } from "../../actions";
export default async function AddPastCouncil() {
  const { session } = await requireAdmin("publish_pages");
  const history = await editablePage(session, "cgc-council-history");
  return (
    <AdminShell
      title="Add a past council."
      description="Enter previous members independently of your current officers."
    >
      <RecordsEditor
        kind="officers"
        initial={[]}
        version={history?.modified_gmt || "new"}
        action={savePastCouncil}
        submitLabel="Publish past council"
        hideMemberTerm
      >
        <Field
          name="councilLabel"
          label="Term name"
          required
          maxLength={100}
          help="For example: 2024–2025"
        />
        <div className="admin-fields">
          <Field name="councilStart" label="Term start" type="date" required />
          <Field name="councilEnd" label="Term end" type="date" required />
        </div>
      </RecordsEditor>
    </AdminShell>
  );
}
