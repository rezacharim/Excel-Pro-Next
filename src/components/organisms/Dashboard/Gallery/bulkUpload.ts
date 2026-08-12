// Helpers for the bulk photo upload flow on the admin Gallery screen.
import imageCompression from "browser-image-compression";
import { GalleryItem } from "@/stores/gallerystore";

/** Files larger than this get downscaled/compressed before upload. */
const COMPRESS_THRESHOLD_BYTES = 2 * 1024 * 1024; // ~2MB
const MAX_DIMENSION_PX = 2000;

/**
 * Derive a human-friendly title from a file name:
 * strip the extension, turn dashes/underscores into spaces, collapse whitespace.
 */
export const titleFromFileName = (fileName: string): string => {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const cleaned = withoutExtension
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "Photo";
};

/**
 * Downscale/compress large images so uploads stay fast.
 * Falls back to the original file if compression fails for any reason.
 */
export const prepareImageForUpload = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/") || file.size <= COMPRESS_THRESHOLD_BYTES) {
    return file;
  }

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: MAX_DIMENSION_PX,
      useWebWorker: true,
    });

    // browser-image-compression returns a File, but guard anyway so the
    // backend always receives a named file.
    if (compressed instanceof File) {
      return compressed;
    }
    return new File([compressed], file.name, {
      type: (compressed as Blob).type || file.type,
    });
  } catch (error) {
    console.error("Image compression failed, uploading original:", error);
    return file;
  }
};

/**
 * Upload one photo using the existing backend contract:
 * POST {NEXT_PUBLIC_API_URL}/gallery, multipart/form-data with 'file' + 'title'.
 */
export const uploadGalleryPhoto = async (
  file: File,
  title: string,
  token: string
): Promise<GalleryItem> => {
  const prepared = await prepareImageForUpload(file);

  const formData = new FormData();
  formData.append("file", prepared);
  formData.append("title", title);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gallery`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }

  return (await response.json()) as GalleryItem;
};
