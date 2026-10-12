import "server-only";
import type { AdminSession } from "./session-codec";
import { wordpressRequest } from "./wordpress";
import { uploadFile } from "./upload";
import { wordpressImage } from "../content/flyer";

export async function libraryFile(session: AdminSession, id: string) {
  if (!/^[1-9]\d*$/.test(id)) throw new Error("Choose an existing image.");
  const media = await wordpressRequest<{
    source_url: string;
    media_type: string;
  }>(session, `media/${id}`, { query: { context: "edit" } });
  const url = wordpressImage(media.source_url);
  if (
    !url ||
    new URL(url).origin !== "https://blog.smu.edu" ||
    media.media_type !== "image" ||
    !/\/(?:files|uploads)\//.test(new URL(url).pathname)
  )
    throw new Error("This image cannot be edited here.");
  const response = await fetch(url, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (
    !response.ok ||
    !response.body ||
    Number(response.headers.get("content-length")) > 20 * 1024 * 1024
  )
    throw new Error("Could not load this image. Try a smaller copy.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 20 * 1024 * 1024)
        throw new Error("This image is too large to edit here.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = Buffer.concat(chunks);
  // Import validation shares the upload signature checks, with a larger source limit.
  const type =
    bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      ? "image/jpeg"
      : bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a"
        ? "image/png"
        : bytes.subarray(0, 4).toString() === "RIFF" &&
            bytes.subarray(8, 12).toString() === "WEBP"
          ? "image/webp"
          : "";
  if (!type) throw new Error("Choose a JPEG, PNG, or WebP image.");
  const extension =
    type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp";
  const file = new File([bytes], `photo-${id}.${extension}`, { type });
  if (file.size <= 2 * 1024 * 1024) await uploadFile(file);
  return file;
}
