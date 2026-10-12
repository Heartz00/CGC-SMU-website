export async function prepareImage(file: File): Promise<File> {
  const limit = 2 * 1024 * 1024;
  if (file.size <= limit) return file;
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Choose an image smaller than 20 MB.");
  if (
    file.type &&
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/octet-stream",
    ].includes(file.type)
  )
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 80000000)
      throw new Error(
        "This image is too large to process. Export a smaller copy.",
      );
    for (const max of [2400, 1800, 1200]) {
      const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context)
        throw new Error("Could not prepare this image. Try a smaller file.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.9, 0.75, 0.6]) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/webp", quality),
        );
        if (blob && blob.size <= limit && blob.type === "image/webp")
          return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
            type: blob.type,
          });
      }
    }
    throw new Error(
      "Could not reduce this image below 2 MB. Export a smaller copy.",
    );
  } finally {
    bitmap.close();
  }
}
