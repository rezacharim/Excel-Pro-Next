import { useState } from "react";
import { NextPage } from "next";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/atoms/Button/Button";
import { useRegisterStepStore } from "@/stores/registerStepStore";
import useUserFormStore from "@/stores/UserFormStore";
import { useFormik } from "formik";
import * as Yup from "yup";

const MAX_FILE_SIZE_MB = 9;

const validationSchema = Yup.object({
  photoUrl: Yup.string().required("Player photo is required"),
  nationalIdCard: Yup.string().required("National ID card photo is required"),
});

const PhotoUploadForm: NextPage = () => {
  const { setStep, step } = useRegisterStepStore();
  const { photoUrl, setPhotoUrl, nationalIdCard, setNationalIdCard } =
    useUserFormStore();

  const [playerPhotoPreview, setPlayerPhotoPreview] = useState<string | null>(
    photoUrl || null
  );
  const [idCardPhotoPreview, setIdCardPhotoPreview] = useState<string | null>(
    nationalIdCard || null
  );
  const [fileError, setFileError] = useState<string>("");

  const formik = useFormik({
    initialValues: {
      photoUrl: photoUrl || "",
      nationalIdCard: nationalIdCard || "",
    },
    validationSchema,
    onSubmit: () => {
      setStep(step + 1);
    },
  });

  const validateFileSize = (file: File): boolean => {
    const isValid = file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
    if (!isValid) {
      setFileError(`File size must be less than ${MAX_FILE_SIZE_MB}MB`);
    } else {
      setFileError("");
    }
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
        setPhotoUrl(base64String);
        setPlayerPhotoPreview(base64String);
        formik.setFieldValue("photoUrl", "player-photo.jpg");
      } catch (err) {
        console.error("Image compression error:", err);
        setFileError("Unsupported file format. Please upload JPG or PNG.");
      }
    }
  };

  const handleIdCardPhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && validateFileSize(file)) {
      try {
        const base64String = await resizeAndConvertToBase64(file);
        setNationalIdCard(base64String);
        setIdCardPhotoPreview(base64String);
        formik.setFieldValue("nationalIdCard", "id-card.jpg");
      } catch (err) {
        console.error("Image compression error:", err);
        setFileError("Failed to process ID card image.");
      }
    }
  };

  return (
    <div className="mb-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Upload Photos</h1>
      <p className="mb-4">
        Please upload a clear photo of the player and a photo of their National
        ID card.
      </p>
      <p className="text-sm text-gray-600 mb-2">
        ⚠️ Maximum file size is 9MB. Larger files will not be accepted.
      </p>

      {fileError && (
        <div className="text-red-500 text-sm mb-4">{fileError}</div>
      )}

      <form onSubmit={formik.handleSubmit}>
        {/* Player Photo */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Player Photo</h2>
          <div className="mt-2 flex flex-col items-center">
            {playerPhotoPreview && (
              <div className="mb-4 relative w-40 h-40">
                <Image
                  src={playerPhotoPreview}
                  alt="Player preview"
                  fill
                  className="object-cover rounded-md border border-gray-300"
                  unoptimized={true}
                />
              </div>
            )}
            <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50">
              <svg
                className="w-8 h-8 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="mt-2 text-base leading-normal">
                Upload player photo
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handlePlayerPhotoChange}
              />
            </label>
            {formik.touched.photoUrl && formik.errors.photoUrl && (
              <div className="text-red-500 text-sm mt-1 w-full">
                {formik.errors.photoUrl}
              </div>
            )}
            <div className="mt-1 text-sm text-gray-500 w-full">
              The photo should clearly show the player&apos;s face. This will be
              used for identification purposes.
            </div>
          </div>
        </div>

        {/* ID Card Photo */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">National ID Card Photo</h2>
          <div className="mt-2 flex flex-col items-center">
            {idCardPhotoPreview && (
              <div className="mb-4 relative w-40 h-40">
                <Image
                  src={idCardPhotoPreview}
                  alt="ID Card preview"
                  fill
                  className="object-cover rounded-md border border-gray-300"
                  unoptimized={true}
                />
              </div>
            )}
            <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50">
              <svg
                className="w-8 h-8 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
                />
              </svg>
              <span className="mt-2 text-base leading-normal">
                Upload ID card photo
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleIdCardPhotoChange}
              />
            </label>
            {formik.touched.nationalIdCard && formik.errors.nationalIdCard && (
              <div className="text-red-500 text-sm mt-1 w-full">
                {formik.errors.nationalIdCard}
              </div>
            )}
            <div className="mt-1 text-sm text-gray-500 w-full">
              Please upload a clear photo of the front side of the National ID
              card.
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <Button
            type="submit"
            className={`font-medium w-full py-3 rounded-md ${
              !formik.values.photoUrl || !formik.values.nationalIdCard
                ? "bg-red-400 cursor-not-allowed"
                : "bg-primary hover:bg-[#c9281e] text-white"
            }`}
            disabled={!formik.values.photoUrl || !formik.values.nationalIdCard}
          >
            Next step
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PhotoUploadForm;
