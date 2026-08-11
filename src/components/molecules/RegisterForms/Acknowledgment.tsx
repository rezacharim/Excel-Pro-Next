import { useState } from "react";
import { NextPage } from "next";
import { Button } from "@/components/atoms/Button/Button";
import { useRegisterStepStore } from "@/stores/registerStepStore";
import useUserFormStore from "@/stores/UserFormStore";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDivisionStore } from "@/stores/divisionStore";

const validationSchema = Yup.object({
  policy: Yup.boolean().oneOf([true], "You must agree to the policy"),
});

// Helper function to normalize division format
const normalizeDivision = (str: string): string => {
  try {
    // If division already has the correct format, return it directly
    if (["U5_U8", "U9_U12", "U13_U14", "U15_U18"].includes(str)) {
      return str;
    }

    // Otherwise normalize - try to handle more formats including "u5-u8"
    const normalized = str
      .toUpperCase()
      .replace(/–|-/g, "_")
      .replace(/\s+/g, "");

    // Try pattern matching for cases like "u5-u8"
    if (/^U\d+[-_]U\d+$/.test(normalized)) {
      // Map specific formats to valid ones
      if (
        normalized.includes("U5") ||
        normalized.includes("U6") ||
        normalized.includes("U7") ||
        normalized.includes("U8")
      ) {
        return "U5_U8";
      } else if (
        normalized.includes("U9") ||
        normalized.includes("U10") ||
        normalized.includes("U11") ||
        normalized.includes("U12")
      ) {
        return "U9_U12";
      } else if (normalized.includes("U13") || normalized.includes("U14")) {
        return "U13_U14";
      } else if (
        normalized.includes("U15") ||
        normalized.includes("U16") ||
        normalized.includes("U17") ||
        normalized.includes("U18")
      ) {
        return "U15_U18";
      }
    }

    // Check if the result is valid
    if (["U5_U8", "U9_U12", "U13_U14", "U15_U18"].includes(normalized)) {
      return normalized;
    }

    // Default value if none matched
    console.warn(`Could not normalize division "${str}", using default value`);
    return "freePlane";
  } catch (error) {
    console.error("Error in normalizeDivision:", error);
    return "freePlane";
  }
};

const Acknowledgment: NextPage = () => {
  const { setStep, step } = useRegisterStepStore();
  const { division } = useDivisionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { policy, setPolicy, photoUrl, nationalIdCard, ...userFormData } =
    useUserFormStore();

  // Main registration function that handles the full registration flow
  const completeRegistration = async () => {
    setIsLoading(true);
    setMessage(null);

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        if (!photoUrl || !nationalIdCard) {
          setMessage(
            "Error: Photo data is missing. Please go back and upload photos again."
          );
          setIsLoading(false);
          return;
        }

        const requestBody = {
          fullname: userFormData.fullname,
          dateOfBirth: userFormData.dateOfBirth,
          gender: userFormData.gender,
          height: userFormData.height.toString(),
          weight: userFormData.weight.toString(),
          tShirtSize: userFormData.tShirtSize,
          shortSize: userFormData.shortSize,
          jacketSize: userFormData.jacketSize,
          pantsSize: userFormData.pantsSize,
          address: userFormData.address,
          postalCode: userFormData.postalCode,
          city: userFormData.city,
          emergencyContactName: userFormData.emergencyContactName,
          emergencyPhone: userFormData.emergencyPhone,
          experienceLevel: userFormData.experienceLevel || "",
          parent_name: userFormData.parent_name,
          phone_number: userFormData.phone_number,
          email: userFormData.email || "",
          player_positions: userFormData.player_positions || "",
          activePlan: normalizeDivision(division!),
          policy: true,
          custom_position: userFormData.custom_position || "",
          photoUrl: photoUrl,
          NationalIdCard: nationalIdCard,
        };

        console.log(`Attempt ${attempt + 1}: Sending registration data...`);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          const responseData = await response.json();
          let errorMessage = "Failed to register user. Please try again.";

          if (Array.isArray(responseData.message)) {
            errorMessage = `Validation errors: ${responseData.message.join(
              ", "
            )}`;
          } else if (responseData.message) {
            errorMessage = responseData.message;
          }

          setMessage(errorMessage);
          break;
        }

        const registeredUser = await response.json();

        if (registeredUser.id) {
          localStorage.setItem("userId", registeredUser.id.toString());
        }

        setIsLoading(false);
        setStep(step + 1);
        return;
      } catch (error) {
        console.error(`Error on attempt ${attempt + 1}:`, error);
        attempt++;
        if (attempt >= maxRetries) {
          setMessage(
            "Error during registration. Please check your internet and try again."
          );
          setIsLoading(false);
          return;
        }

        await new Promise((res) => setTimeout(res, 1000));
      }
    }
  };

  // Use formik for handling form validation
  const formik = useFormik({
    initialValues: {
      policy: policy || false,
    },
    validationSchema,
    onSubmit: async (values) => {
      // Update store with form values
      setPolicy(values.policy);
      // Start the registration process
      await completeRegistration();
    },
  });

  return (
    <>
      {/* Form Content */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">
          Terms and Conditions
        </h1>
        <p className="text-gray-600 mb-4">
          Please review and agree to the following terms before completing your
          registration.
        </p>

        {message && (
          <div
            className={`p-4 mb-4 ${
              message.includes("Failed") || message.includes("Error")
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-yellow-50 border border-yellow-200 text-yellow-700"
            } rounded-md`}
          >
            {message}
          </div>
        )}

        <form onSubmit={formik.handleSubmit}>
          <div className="mt-6 border rounded-lg p-5 bg-gray-50">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Policy Agreement</h2>
              <div className="text-gray-700 mb-4 leading-relaxed text-sm">
                <p className="mb-2">
                  I the parent or guardian of the above named player understand
                  and assume all risks involved in playing soccer, including the
                  risk of property damage, personal injury and death resulting
                  from any cause whatsoever, including but not limited to
                  collision with the ball, other players, persons, the ground,
                  goal post or other man-made objects, weather and field
                  conditions, traffic hazards while being transported to or from
                  any location.
                </p>
                <p className="mb-2">
                  I have considered these risks and hereby consent to the
                  Player&apos;s participation in Excel Pro Soccer Academy and
                  agree that Excel Pro Soccer Academy shall not be responsible
                  for any such personal injury, death or property loss.
                </p>
                <p className="mb-2">
                  I grant Excel Pro Soccer Academy the right to request any
                  participant, player, parent or volunteer to withdraw from the
                  program prior to its termination if the person is not acting
                  in a responsible, safe, fair and/or sportsmanlike manner.
                </p>
                <p className="mb-2">
                  I understand that the information collected on this form will
                  be used by the organization to establish my child&apos;s
                  eligibility to participate in their soccer program and to
                  contact me when required in respect to soccer related
                  activities. The names, addresses, phone numbers and email
                  addresses on this form may be shared with members of the team
                  that my child is on.
                </p>
                <p className="mb-2">
                  I agree to allow Excel Pro Soccer Academy to use the
                  player&apos;s image in photo or Video releases they deem
                  appropriate. I further acknowledge that the likeness of the
                  player may be captured and stored by other parents,
                  organizations and media companies without the knowledge or
                  consent of Excel Pro Soccer Academy.
                </p>
              </div>

              <div className="flex items-center">
                <input
                  id="policy"
                  name="policy"
                  type="checkbox"
                  checked={formik.values.policy}
                  onChange={(e) =>
                    formik.setFieldValue("policy", e.target.checked)
                  }
                  className="h-4 w-4 text-red-600 focus:ring-red-500"
                />
                <label
                  htmlFor="policy"
                  className="ml-2 block text-gray-900 font-medium"
                >
                  I agree to the policy
                </label>
              </div>
              {formik.touched.policy && formik.errors.policy && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.policy}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <Button
              type="submit"
              className={`font-medium w-full py-3 rounded-md ${
                !formik.values.policy || isLoading
                  ? "bg-red-400 cursor-not-allowed"
                  : "bg-primary hover:bg-[#c9281e] text-white"
              }`}
              disabled={!formik.values.policy || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing Registration...
                </span>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Acknowledgment;
