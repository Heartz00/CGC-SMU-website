import { validDate, safeUrl } from "../content/adapters";
import { wordpressImage } from "../content/flyer";
export function recordErrors(form: FormData, kind: "officers" | "events") {
  const errors: Record<string, string> = {};
  const main = kind === "officers" ? "name" : "title";
  const get = (field: string, index: number) =>
    String(form.getAll(field)[index] || "").trim();
  form.getAll(main).forEach((_, index) => {
    const set = (field: string, text: string) => {
      errors[`${field}:${index}`] = text;
    };
    if (!get(main, index)) set(main, "This field is required.");
    if (kind === "officers") {
      if (!get("role", index)) set("role", "Enter a role.");
      for (const [field, limit] of [
        ["name", 150],
        ["role", 150],
        ["term", 100],
        ["bio", 5000],
      ] as const)
        if (get(field, index).length > limit)
          set(field, `Use ${limit} characters or fewer.`);
      if (
        get("email", index) &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get("email", index))
      )
        set("email", "Enter a valid email address.");
      if (get("photo", index) && !wordpressImage(get("photo", index)))
        set("photo", "Choose an image from the library.");
    } else {
      if (!validDate(get("start", index)))
        set("start", "Choose a valid date and time.");
      if (
        get("end", index) &&
        (!validDate(get("end", index)) ||
          Date.parse(get("end", index)) < Date.parse(get("start", index)))
      )
        set("end", "The end must follow the start.");
      if (get("registration", index) && !safeUrl(get("registration", index)))
        set("registration", "Use an https:// link.");
      if (get("flyer", index) && !wordpressImage(get("flyer", index)))
        set("flyer", "Choose an image from the library.");
      if (get("description", index).length > 5000)
        set("description", "Use 5,000 characters or fewer.");
    }
  });
  return errors;
}
