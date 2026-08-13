import { useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";

const MAX_FILE_SIZE_MB = 9;

type PlayerPhotoUploadProps = {
  /** Base64 data URL of the current photo, or "" when none has been chosen. */
  value: string;
  onChange: (dataUrl: string) => void;
};

/**
 * Optional player photo. Uploads are compressed in the browser before they are
 * turned into a data URL, because the registration request carries the image
 * inline. The government ID upload that used to sit next to this was removed —
 * parents abandoned the form rather than photograph their ID.
 */
const PlayerPhotoUpload = ({ value, onChange }: PlayerPhotoUploadProps) => {
  const [fileError, setFileError] = useState<string>("");

  const validateFileSize = (file: File): boolean => {
    const isValid = file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
    setFileError(isValid ? "" : `File size must be less than ${MAX_FILE_SIZE_MB}MB`);
    return isValid;
  };

  const resizeAndConvertToBase64 = async (file: File): Promise<string> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1000,
      useWebWorker: true,
    };

    const compressedFile = await imageCompression(file, options);
    return await imageCompression.getDataUrlFromFile(compressedFile);
  };

  const handlePlayerPhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && validateFileSize(file)) {
      try {
        const base64String = await resizeAndConvertToBase64(file);
        onChange(base64String);
      } catch (err) {
        console.error("Image compression error:", err);
        setFileError("Unsupported file format. Please upload JPG or PNG.");
      }
    }
  };

  return (
    <div>
      <p className="block text-sm font-medium text-gray-800 mb-1.5">
        Player photo (optional)
      </p>
      <p className="text-sm text-gray-500 mb-3">
        You can skip this and add it later.
      </p>

      {value && (
        <div className="mb-4 relative w-32 h-32">
          <Image
            src={value}
            alt="Player photo preview"
            fill
            className="object-cover rounded-md border border-gray-300"
            unoptimized={true}
          />
        </div>
      )}

      <label
        htmlFor="playerPhoto"
        className="flex min-h-[44px] w-full cursor-pointer flex-col items-center rounded-md border border-gray-300 bg-white px-4 py-5 hover:bg-gray-50"
      >
        <svg
          className="w-7 h-7 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="mt-2 text-base leading-normal">
          {value ? "Choose a different photo" : "Add a photo"}
        </span>
        <input
          id="playerPhoto"
          name="playerPhoto"
          type="file"
          className="sr-only"
          accept="image/*"
          onChange={handlePlayerPhotoChange}
        />
      </label>

      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setFileError("");
          }}
          className="mt-2 text-sm text-gray-500 underline hover:text-gray-700"
        >
          Remove photo
        </button>
      )}

      <p className="mt-2 text-xs text-gray-500">
        Maximum file size is {MAX_FILE_SIZE_MB}MB.
      </p>

      {fileError && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {fileError}
        </p>
      )}
    </div>
  );
};

export default PlayerPhotoUpload;
