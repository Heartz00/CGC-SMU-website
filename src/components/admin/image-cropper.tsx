"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { cropBounds } from "@/lib/admin/image-crop";
import { prepareImage } from "@/lib/admin/prepare-image";

const shapes = [
  { value: "original", label: "Original shape" },
  { value: "1", label: "Square" },
  { value: "0.8", label: "Portrait (4:5)" },
  { value: "1.5", label: "Landscape (3:2)" },
  { value: "1.7777777778", label: "Wide (16:9)" },
];
export function ImageCropper({
  file,
  onApply,
  onCancel,
}: {
  file: File;
  onApply: (file: File) => void;
  onCancel: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [source, setSource] = useState<HTMLCanvasElement | null>(null);
  const [shape, setShape] = useState("original");
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(0.5);
  const [y, setY] = useState(0.5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    let cancelled = false;
    createImageBitmap(file)
      .then((bitmap) => {
        try {
          if (cancelled) return;
          if (bitmap.width * bitmap.height > 80000000)
            throw new Error("Choose a smaller image to edit.");
          const buffer = document.createElement("canvas");
          const scale = Math.min(
            1,
            2400 / Math.max(bitmap.width, bitmap.height),
          );
          buffer.width = Math.max(1, Math.round(bitmap.width * scale));
          buffer.height = Math.max(1, Math.round(bitmap.height * scale));
          const context = buffer.getContext("2d");
          if (!context)
            throw new Error("Image editing is unavailable in this browser.");
          context.drawImage(bitmap, 0, 0, buffer.width, buffer.height);
          setSource(buffer);
        } finally {
          bitmap.close();
        }
      })
      .catch(() => {
        if (!cancelled)
          setError("Could not open this image. Try a JPEG, PNG, or WebP file.");
      });
    return () => {
      cancelled = true;
      active.current = false;
    };
  }, [file]);
  const render = useCallback(
    (target: HTMLCanvasElement, max: number) => {
      if (!source) return;
      const turned = document.createElement("canvas");
      const sideways = rotation % 180 !== 0;
      turned.width = sideways ? source.height : source.width;
      turned.height = sideways ? source.width : source.height;
      const rotated = turned.getContext("2d");
      if (!rotated) throw new Error("Could not draw this image.");
      rotated.translate(turned.width / 2, turned.height / 2);
      rotated.rotate((rotation * Math.PI) / 180);
      rotated.drawImage(source, -source.width / 2, -source.height / 2);
      const ratio =
        shape === "original" ? turned.width / turned.height : Number(shape);
      const crop = cropBounds(turned.width, turned.height, ratio, zoom, x, y);
      const scale = Math.min(1, max / Math.max(crop.width, crop.height));
      target.width = Math.max(1, Math.round(crop.width * scale));
      target.height = Math.max(1, Math.round(crop.height * scale));
      const context = target.getContext("2d");
      if (!context) throw new Error("Could not draw this image.");
      context.drawImage(
        turned,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        target.width,
        target.height,
      );
    },
    [source, rotation, shape, zoom, x, y],
  );
  useEffect(() => {
    if (!canvas.current || !source) return;
    const frame = requestAnimationFrame(() => {
      if (!canvas.current) return;
      try {
        render(canvas.current, 700);
      } catch {
        setError("Could not preview this image.");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [source, render]);
  async function apply() {
    setBusy(true);
    setError("");
    try {
      const output = document.createElement("canvas");
      render(output, 2400);
      let blob = await new Promise<Blob | null>((resolve) =>
        output.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Could not export this crop.");
      if (blob.size > 2 * 1024 * 1024) {
        blob = await new Promise<Blob | null>((resolve) =>
          output.toBlob(resolve, "image/webp", 0.9),
        );
        if (!blob) throw new Error("Could not export this crop.");
      }
      const extension = blob.type === "image/webp" ? "webp" : "png";
      const cropped = await prepareImage(
        new File(
          [blob],
          `${file.name.replace(/\.[^.]+$/, "")}-cropped.${extension}`,
          {
            type: blob.type,
          },
        ),
      );
      if (active.current) onApply(cropped);
    } catch (reason) {
      if (active.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not crop this image.",
        );
    } finally {
      if (active.current) setBusy(false);
    }
  }
  return (
    <section className="admin-cropper" aria-label="Adjust image">
      <h3>Adjust image</h3>
      <div className="admin-crop-preview">
        <canvas
          ref={canvas}
          role="img"
          aria-label="Preview of the cropped image"
        />
      </div>
      <fieldset disabled={busy || !source}>
        <label className="admin-field">
          <span>Crop shape</span>
          <select
            value={shape}
            onChange={(event) => setShape(event.target.value)}
          >
            {shapes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span>Zoom ({zoom.toFixed(1)}×)</span>
          <input
            type="range"
            min="1"
            max="4"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>
        <label className="admin-field">
          <span>Horizontal position</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={x}
            onChange={(event) => setX(Number(event.target.value))}
          />
        </label>
        <label className="admin-field">
          <span>Vertical position</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={y}
            onChange={(event) => setY(Number(event.target.value))}
          />
        </label>
        <div className="admin-crop-actions">
          <button
            type="button"
            className="admin-secondary"
            onClick={() => setRotation((value) => (value + 90) % 360)}
          >
            Rotate 90°
          </button>
          <button
            type="button"
            className="admin-secondary"
            onClick={() => {
              setShape("original");
              setRotation(0);
              setZoom(1);
              setX(0.5);
              setY(0.5);
            }}
          >
            Reset
          </button>
          <button type="button" className="button" onClick={apply}>
            Apply crop
          </button>
        </div>
      </fieldset>
      <button
        type="button"
        className="admin-secondary"
        disabled={busy}
        onClick={onCancel}
      >
        Cancel
      </button>
      <p role="status">
        {busy
          ? "Preparing crop…"
          : error ||
            (!source
              ? "Opening image…"
              : "Adjust the sliders, then apply the crop.")}
      </p>
    </section>
  );
}
