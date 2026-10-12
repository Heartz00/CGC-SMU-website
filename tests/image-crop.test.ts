import test from "node:test";
import assert from "node:assert/strict";
import { cropBounds } from "../src/lib/admin/image-crop";

test("square crop centers a landscape photo and moves within the source", () => {
  assert.deepEqual(cropBounds(1200, 800, 1, 1, 0.5, 0.5), {
    x: 200,
    y: 0,
    width: 800,
    height: 800,
  });
  assert.deepEqual(cropBounds(1200, 800, 1, 2, 1, 1), {
    x: 800,
    y: 400,
    width: 400,
    height: 400,
  });
});
test("portrait and wide crops never extend beyond source pixels", () => {
  for (const ratio of [0.8, 1.5, 16 / 9])
    for (const zoom of [1, 2, 4]) {
      const crop = cropBounds(800, 1200, ratio, zoom, 1, 1);
      assert.ok(crop.x >= 0 && crop.y >= 0);
      assert.ok(crop.x + crop.width <= 800 + 1e-8);
      assert.ok(crop.y + crop.height <= 1200 + 1e-8);
      assert.ok(Math.abs(crop.width / crop.height - ratio) < 1e-8);
    }
});
test("invalid crops fail and position values are clamped", () => {
  assert.throws(() => cropBounds(0, 100, 1, 1, 0, 0));
  assert.throws(() => cropBounds(100, 100, 1, 0, 0, 0));
  assert.throws(() => cropBounds(100, 100, NaN, 1, 0, 0));
  assert.deepEqual(cropBounds(100, 100, 1, 2, -1, 2), {
    x: 0,
    y: 50,
    width: 50,
    height: 50,
  });
});
