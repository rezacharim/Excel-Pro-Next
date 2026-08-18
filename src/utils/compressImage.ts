/**
 * Shrink a photo in the browser before it is uploaded.
 *
 * Why this exists: the API runs as a Vercel serverless function, and Vercel
 * refuses any request body over 4.5 MB at the edge — before our code sees it.
 * No response comes back, so `fetch` fails with the useless message "Failed to
 * fetch". A photo straight off a phone or a scanner is routinely 3–8 MB, so
 * uploads were failing for exactly the pictures people most want to add.
 *
 * Shrinking to a sensible size for a website also means pages load faster:
 * nothing on the site displays an image wider than about 1600px.
 */

/** Longest edge, in pixels, of the uploaded photo. */
const MAX_EDGE = 1600;
/** Anything at or below this is sent untouched. */
const SKIP_BELOW_BYTES = 900 * 1024;
/** Vercel's hard limit is 4.5 MB; stay clearly underneath it. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const canDecode = (file: File): boolean =>
  file.type.startsWith("image/") &&
  // Safari can decode HEIC, most other browsers cannot. Rather than produce a
  // blank canvas, leave these alone and let the size check speak for itself.
  !/hei[cf]/i.test(file.type);

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image"));
    };
    img.src = url;
  });

/**
 * Returns a smaller File, or the original if it is already small enough or
 * cannot be decoded. Never throws — a failure to compress should not stop
 * someone uploading a photo that was going to work anyway.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.size <= SKIP_BELOW_BYTES || !canDecode(file)) return file;

  try {
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    // Step the quality down until it fits. Two passes is almost always enough;
    // the loop is a backstop for very large, very detailed scans.
    for (const quality of [0.85, 0.7, 0.55]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
      if (!blob) break;
      if (blob.size <= MAX_UPLOAD_BYTES) {
        // Only use it if we actually saved something.
        if (blob.size >= file.size) return file;
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }
    }
    return file;
  } catch {
    return file;
  }
}

/** Human-readable size, for error messages. */
export const formatBytes = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;
