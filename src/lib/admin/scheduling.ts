import { validDate } from "../content/adapters";
import { AdminError } from "./errors";
export function publicationDate(
  status: string,
  value: string,
  now = Date.now(),
) {
  if (status !== "future") return undefined;
  if (!validDate(value) || Date.parse(value) <= now + 60000)
    throw new AdminError(
      "validation",
      "Choose a publication time at least one minute in the future.",
    );
  return new Date(value).toISOString().replace(/Z$/, "");
}
