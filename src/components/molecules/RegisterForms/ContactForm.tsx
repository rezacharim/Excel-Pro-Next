import { useState } from "react";
import { NextPage } from "next";
import { Button } from "@/components/atoms/Button/Button";
import { useRegisterStepStore } from "@/stores/registerStepStore";
import FloatingLabelInput from "@/components/organisms/FloatingLabelInput/FloatingLabelInput";
import useUserFormStore from "@/stores/UserFormStore";
import { useFormik } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object({
  address: Yup.string()
    .required("Address is required")
    .max(500, "Address cannot exceed 500 characters"),
  postalCode: Yup.string()
    .required("Postal code is required")
    .max(20, "Postal code cannot exceed 20 characters"),
  city: Yup.string()
    .required("City is required")
    .max(100, "City cannot exceed 100 characters"),
  emergencyContactName: Yup.string()
    .required("Emergency contact name is required")
    .max(200, "Emergency contact name cannot exceed 200 characters"),
  emergencyPhone: Yup.string()
    .required("Emergency phone is required")
    .max(20, "Emergency phone cannot exceed 20 characters"),
});

const AddressAndEmergencyForm: NextPage = () => {
  const { setStep, step } = useRegisterStepStore();
  const { 
    address, 
    postalCode, 
    city, 
    emergencyContactName, 
    emergencyPhone,
    setAddress,
    setPostalCode,
    setCity,
    setEmergencyContactName,
    setEmergencyPhone
  } = useUserFormStore();

  const [focused, setFocused] = useState({
    address: Boolean(address),
    postalCode: Boolean(postalCode),
    city: Boolean(city),
    emergencyContactName: Boolean(emergencyContactName),
    emergencyPhone: Boolean(emergencyPhone),
  });

  const formik = useFormik({
    initialValues: {
      address: address || "",
      postalCode: postalCode || "",
      city: city || "",
      emergencyContactName: emergencyContactName || "",
      emergencyPhone: emergencyPhone || "",
    },
    validationSchema,
    onSubmit: (values) => {
      setAddress(values.address);
      setPostalCode(values.postalCode);
      setCity(values.city);
      setEmergencyContactName(values.emergencyContactName);
      setEmergencyPhone(values.emergencyPhone);
      const nextStep = step + 1;
      setStep(nextStep);
    },
  });

  const handleFocus = (field: string) => {
    setFocused({
      ...focused,
      [field]: true,
    });
  };

  const handleBlur = (field: string) => {
    formik.handleBlur({ target: { name: field } });
    setFocused({
      ...focused,
      [field]: formik.values[field as keyof typeof formik.values] !== "",
    });
  };

  return (
    <>
      {/* Form Content */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">
          Location and Emergency Contact Information
        </h1>
        <p className="mb-4">
          Please provide your address details and emergency contact information. This information will be used in case of emergency during training sessions or matches.
        </p>

        <form onSubmit={formik.handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mt-6">
            {/* Address */}
            <div>
              <FloatingLabelInput
                id="address"
                name="address"
                label="Full Address"
                type="text"
                value={formik.values.address}
                onChange={formik.handleChange}
                onFocus={() => handleFocus("address")}
                onBlur={() => handleBlur("address")}
                placeholder="Example: 123 Main Street, Apartment 4B"
                isFocused={focused.address}
              />
              {formik.touched.address && formik.errors.address && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.address}
                </div>
              )}
            </div>

            {/* City and Postal Code */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FloatingLabelInput
                  id="city"
                  name="city"
                  label="City"
                  type="text"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                  onFocus={() => handleFocus("city")}
                  onBlur={() => handleBlur("city")}
                  placeholder="Example: New York"
                  isFocused={focused.city}
                />
                {formik.touched.city && formik.errors.city && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.city}
                  </div>
                )}
              </div>

              <div>
                <FloatingLabelInput
                  id="postalCode"
                  name="postalCode"
                  label="Postal Code"
                  type="text"
                  value={formik.values.postalCode}
                  onChange={formik.handleChange}
                  onFocus={() => handleFocus("postalCode")}
                  onBlur={() => handleBlur("postalCode")}
                  placeholder="Example: 10001"
                  isFocused={focused.postalCode}
                />
                {formik.touched.postalCode && formik.errors.postalCode && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.postalCode}
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact Information */}
            <h2 className="text-lg font-semibold mt-4">Emergency Contact</h2>
            
            <div>
              <FloatingLabelInput
                id="emergencyContactName"
                name="emergencyContactName"
                label="Emergency Contact Name"
                type="text"
                value={formik.values.emergencyContactName}
                onChange={formik.handleChange}
                onFocus={() => handleFocus("emergencyContactName")}
                onBlur={() => handleBlur("emergencyContactName")}
                placeholder="Example: John Doe"
                isFocused={focused.emergencyContactName}
              />
              {formik.touched.emergencyContactName && formik.errors.emergencyContactName && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.emergencyContactName}
                </div>
              )}
            </div>

            <div>
              <FloatingLabelInput
                id="emergencyPhone"
                name="emergencyPhone"
                label="Emergency Phone Number"
                type="tel"
                value={formik.values.emergencyPhone}
                onChange={formik.handleChange}
                onFocus={() => handleFocus("emergencyPhone")}
                onBlur={() => handleBlur("emergencyPhone")}
                placeholder="Example: +1-555-123-4567"
                isFocused={focused.emergencyPhone}
              />
              {formik.touched.emergencyPhone && formik.errors.emergencyPhone && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.emergencyPhone}
                </div>
              )}
            </div>
          </div>

          {/* Next Button */}
          <div className="mt-8">
            <Button
              type="submit"
              className={`font-medium w-full py-3 rounded-md ${
                !formik.isValid || formik.isSubmitting
                  ? "bg-red-400 cursor-not-allowed"
                  : "bg-primary hover:bg-[#c9281e] text-white"
              }`}
              disabled={!formik.isValid || formik.isSubmitting}
            >
              Next step
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddressAndEmergencyForm;