const MAX_DIMENSION = 1600; // px — generous for retina at the card's max render size
const WEBP_QUALITY = 0.85;

// GIFs can be a single static frame or an animation. Canvas re-encoding only
// captures one frame, so animated GIFs must be left alone or they'd lose motion.
async function isAnimatedGif(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let graphicControlBlocks = 0;
  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9) {
      graphicControlBlocks++;
      if (graphicControlBlocks > 1) return true;
    }
  }
  return false;
}

async function shouldSkipProcessing(file: File): Promise<boolean> {
  if (file.type === "image/svg+xml") return true;
  if (file.type === "image/gif") return isAnimatedGif(file);
  return false;
}

/**
 * Resizes (capped at MAX_DIMENSION) and re-encodes an uploaded image as
 * WebP to keep event poster uploads at an appropriate web file size.
 * Returns the original file untouched if it's an SVG, an animated GIF,
 * or if re-encoding doesn't actually come out smaller.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  try {
    if (await shouldSkipProcessing(file)) return file;

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp" });
  } catch {
    return file;
  }
}
