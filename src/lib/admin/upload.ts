import { AdminError } from "./errors";
export const imageLimit = 2 * 1024 * 1024;
export class UploadError extends AdminError {
  constructor(
    public notice:
      "image-missing" | "image-size" | "image-format" | "image-description",
  ) {
    super("validation", notice);
  }
}
export async function uploadFile(file: FormDataEntryValue | null) {
  if (!file || typeof file === "string" || !file.size)
    throw new UploadError("image-missing");
  if (file.size > imageLimit) throw new UploadError("image-size");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type =
    bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      ? "image/jpeg"
      : [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)
        ? "image/png"
        : Buffer.from(bytes.subarray(0, 4)).toString() === "RIFF" &&
            Buffer.from(bytes.subarray(8, 12)).toString() === "WEBP"
          ? "image/webp"
          : "";
  if (
    !type ||
    (file.type &&
      file.type !== "application/octet-stream" &&
      file.type !== type)
  )
    throw new UploadError("image-format");
  const extension =
    type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp";
  const name =
    file.name
      .replace(/\.[^.]*$/, "")
      .replace(/[^\w.-]/g, "_")
      .slice(0, 120) || "image";
  return new File([bytes], `${name}.${extension}`, { type });
}
