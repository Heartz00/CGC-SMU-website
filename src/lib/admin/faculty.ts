import { facultyPositions } from "../content/faculty";
import { officerForm, textField } from "./content";
import { AdminError } from "./errors";
import { wordpressImage } from "../content/flyer";

export function facultyForm(form: FormData) {
  const records = new FormData();
  for (const { key, role } of facultyPositions) {
    const name = textField(form, `${key}Name`, 150);
    const bio = textField(form, `${key}Bio`, 5000);
    const email = textField(form, `${key}Email`, 254);
    const photo = textField(form, `${key}Photo`, 1000);
    if (!name && !bio && !email && !photo) continue;
    if (!name)
      throw new AdminError(
        "validation",
        `${role}: enter a full name before saving this profile.`,
      );
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new AdminError(
        "validation",
        `${role}: enter a valid email address.`,
      );
    if (photo && !wordpressImage(photo))
      throw new AdminError(
        "validation",
        `${role}: select a photo from the image library.`,
      );
    for (const [field, value] of Object.entries({
      name,
      role,
      bio,
      email,
      photo,
      term: "",
    }))
      records.append(field, value);
  }
  return officerForm(records);
}
