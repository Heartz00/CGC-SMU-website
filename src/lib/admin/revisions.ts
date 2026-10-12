import { AdminError } from "./errors";
import type { EditablePost } from "./wordpress";
export type Revision = {
  id: number;
  parent: number;
  author: number;
  date_gmt: string;
  title: { raw?: string; rendered: string };
  content: { raw?: string; rendered: string };
};
export async function restoreVersion(
  id: number,
  version: string,
  revision: Revision,
  current: EditablePost,
  save: (body: { title: string; content: string }) => Promise<EditablePost>,
) {
  if (current.id !== id || revision.parent !== id)
    throw new AdminError(
      "validation",
      "This version belongs to a different record.",
    );
  if (current.modified_gmt !== version)
    throw new AdminError(
      "conflict",
      "This content changed. Reload before restoring.",
    );
  if (
    typeof revision.content.raw !== "string" ||
    typeof revision.title.raw !== "string"
  )
    throw new AdminError(
      "validation",
      "The original editable content is unavailable.",
    );
  return save({ title: revision.title.raw, content: revision.content.raw });
}
