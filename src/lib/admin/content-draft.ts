export const draftFields = [
  "title",
  "body",
  "flyer",
  "registration",
  "calendar",
  "location",
  "start",
  "end",
] as const;
export type DraftFields = Partial<Record<(typeof draftFields)[number], string>>;
export type ContentDraft = { version: 1; savedAt: number; fields: DraftFields };
export function readDraft(
  raw: string | null,
  now = Date.now(),
): ContentDraft | null {
  if (!raw || raw.length > 400000) return null;
  try {
    const value = JSON.parse(raw);
    if (
      value.version !== 1 ||
      !Number.isFinite(value.savedAt) ||
      value.savedAt > now ||
      now - value.savedAt > 7 * 24 * 60 * 60 * 1000 ||
      !value.fields ||
      typeof value.fields !== "object"
    )
      return null;
    const fields: DraftFields = {};
    for (const name of draftFields) {
      const text = value.fields[name];
      if (
        text !== undefined &&
        (typeof text !== "string" ||
          text.length > (name === "body" ? 50000 : 2000))
      )
        return null;
      if (typeof text === "string") fields[name] = text;
    }
    return { version: 1, savedAt: value.savedAt, fields };
  } catch {
    return null;
  }
}
export function snapshotDraft(data: FormData, now = Date.now()): ContentDraft {
  const fields: DraftFields = {};
  for (const name of draftFields) {
    const value = data.get(name);
    if (typeof value === "string") fields[name] = value;
  }
  return { version: 1, savedAt: now, fields };
}
