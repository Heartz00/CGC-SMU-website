import { load } from "cheerio";
import { councilTermId, parseCouncilHistory } from "../content/council-history";
import { AdminError } from "./errors";
import type { EditablePost } from "./wordpress";

export async function undoCouncilArchive(
  id: string,
  version: string,
  store: {
    read: () => Promise<EditablePost | null>;
    save: (content: string, expected: string) => Promise<EditablePost>;
  },
) {
  const page = await store.read();
  if (!page || page.modified_gmt !== version)
    throw new AdminError(
      "conflict",
      "The archive changed. Reload before trying again.",
    );
  const terms = parseCouncilHistory(page.content.rendered);
  if (!terms.some((term) => term.id === id))
    throw new AdminError("validation", "This archive is no longer available.");
  const $ = load(page.content.rendered, null, false);
  $("table").each((_, table) => {
    const rows = $(table).find("tr").toArray();
    const headers = $(rows[0])
      .find("th,td")
      .toArray()
      .map((cell) => $(cell).text().trim());
    if (!["Term", "Start", "End"].every((key) => headers.includes(key))) return;
    for (const row of rows.slice(1)) {
      const cells = $(row).find("td");
      const get = (key: string) => cells.eq(headers.indexOf(key)).text().trim();
      if (councilTermId(get("Term"), get("Start"), get("End")) === id)
        $(row).remove();
    }
  });
  return store.save($.html(), version);
}
