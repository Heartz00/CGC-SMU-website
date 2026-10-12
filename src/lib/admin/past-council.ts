import {
  councilTermId,
  historyTable,
  parseCouncilHistory,
  validTermDate,
} from "../content/council-history";
import { officerForm, textField } from "./content";
import { AdminError } from "./errors";
import type { EditablePost } from "./wordpress";
export async function addPastCouncil(
  form: FormData,
  store: {
    read: () => Promise<EditablePost | null>;
    save: (content: string, expected: string) => Promise<EditablePost>;
  },
) {
  const label = textField(form, "councilLabel", 100),
    start = textField(form, "councilStart", 10),
    end = textField(form, "councilEnd", 10);
  if (!label || !validTermDate(start) || !validTermDate(end) || end < start)
    throw new AdminError(
      "validation",
      "Enter a term name and valid start/end dates.",
    );
  const officers = officerForm(form).map((o) => ({
    ...o,
    term: label,
    termStart: start,
    termEnd: end,
  }));
  if (!officers.length)
    throw new AdminError("validation", "Add at least one past member.");
  const page = await store.read(),
    version = textField(form, "version", 80);
  if ((page?.modified_gmt || "new") !== version)
    throw new AdminError(
      "conflict",
      "The archive changed. Reload before saving.",
    );
  const terms = parseCouncilHistory(page?.content.rendered || ""),
    id = councilTermId(label, start, end);
  if (terms.some((t) => t.id === id))
    throw new AdminError(
      "validation",
      "This term already exists. Undo its archive before replacing it.",
    );
  if (terms.length >= 60)
    throw new AdminError("validation", "The archive is full.");
  // Append the new table so existing snapshots and their formatting stay intact.
  return store.save(
    (page?.content.rendered || "") +
      historyTable([{ id, label, start, end, officers }]),
    version,
  );
}
