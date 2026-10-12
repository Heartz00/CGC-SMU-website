import test from "node:test";
import assert from "node:assert/strict";
import { uploadFile, UploadError, imageLimit } from "../src/lib/admin/upload";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nZwAAAAASUVORK5CYII=",
  "base64",
);
test("uploads infer a missing MIME type from verified image bytes and normalize filenames", async () => {
  const result = await uploadFile(new File([png], "My flyer.bin"));
  assert.equal(result.type, "image/png");
  assert.equal(result.name, "My_flyer.png");
  assert.deepEqual(Buffer.from(await result.arrayBuffer()), png);
});
test("uploads return distinct validation reasons for missing, large, and invalid files", async () => {
  const reason = (notice: string) => (error: unknown) =>
    error instanceof UploadError && error.notice === notice;
  await assert.rejects(uploadFile(null), reason("image-missing"));
  await assert.rejects(
    uploadFile(
      new File([new Uint8Array(imageLimit + 1)], "large.png", {
        type: "image/png",
      }),
    ),
    reason("image-size"),
  );
  await assert.rejects(
    uploadFile(new File(["not an image"], "fake.png", { type: "image/png" })),
    reason("image-format"),
  );
  await assert.rejects(
    uploadFile(new File([png], "wrong.jpg", { type: "image/jpeg" })),
    reason("image-format"),
  );
});
