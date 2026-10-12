export function cropBounds(
  width: number,
  height: number,
  ratio: number,
  zoom: number,
  x: number,
  y: number,
) {
  if (
    ![width, height, ratio, zoom, x, y].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0 ||
    ratio <= 0 ||
    zoom < 1
  )
    throw new Error("Invalid crop dimensions.");
  const cropWidth = Math.min(width, height * ratio) / zoom;
  const cropHeight = cropWidth / ratio;
  return {
    x: (width - cropWidth) * Math.max(0, Math.min(1, x)),
    y: (height - cropHeight) * Math.max(0, Math.min(1, y)),
    width: cropWidth,
    height: cropHeight,
  };
}
