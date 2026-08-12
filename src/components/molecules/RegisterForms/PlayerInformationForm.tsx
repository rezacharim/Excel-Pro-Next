import { useState } from "react";
import { NextPage } from "next";
import { Button } from "@/components/atoms/Button/Button";
import { useRegisterStepStore } from "@/stores/registerStepStore";
import FloatingLabelInput from "@/components/organisms/FloatingLabelInput/FloatingLabelInput";
import useUserFormStore from "@/stores/UserFormStore";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Gender, TShirtSize } from "@/stores/UserFormStore/enums/enums";
import PracticeSchedule from "./PracticeSchedule/PracticeSchedule";

const validationSchema = Yup.object({
  fullname: Yup.string().required("Fullname is required"),
  dateOfBirth: Yup.string().required("Date of birth is required"),
  gender: Yup.string().required("Gender is required"),
  parent_name: Yup.string().required("Parent name is required"),
  phone_number: Yup.string()
    .required("Parent phone number is required")
    .matches(
      /^(\+1)?\d{10}$/,
      "Enter a valid phone number: +1 followed by 10 digits"
    ),
  email: Yup.string().email("Invalid email").required("Email is required"),
  height: Yup.number().positive("Height must be positive").required("Height is required"),
  weight: Yup.number().positive("Weight must be positive").required("Weight is required"),
  tShirtSize: Yup.string().required("T-shirt size is required"),
  shortSize: Yup.string().required("Short size is required"),
  jacketSize: Yup.string().required("Jacket size is required"),
  pantsSize: Yup.string().required("Pants size is required"),
});

const PlayerInformationForm: NextPage = () => {
  const { step, setStep } = useRegisterStepStore();
  const {
    fullname,
    dateOfBirth,
    gender,
    parent_name,
    phone_number,
    email,
    emailVerified,
    height,
    weight,
    tShirtSize,
    shortSize,
    jacketSize,
    pantsSize,
    setFullname,
    setDateOfBirth,
    setGender,
    setParentName,
    setPhoneNumber,
    setEmail,
    setHeight,
    setWeight,
    setTShirtSize,
    setShortSize,
    setJacketSize,
    setPantsSize,
  } = useUserFormStore();

  const [focused, setFocused] = useState({
    fullname: Boolean(fullname),
    dateOfBirth: Boolean(dateOfBirth),
    gender: Boolean(gender),
    parent_name: Boolean(parent_name),
    phone_number: Boolean(phone_number),
    email: Boolean(email),
    height: Boolean(height),
    weight: Boolean(weight),
    tShirtSize: Boolean(tShirtSize),
    shortSize: Boolean(shortSize),
    jacketSize: Boolean(jacketSize),
    pantsSize: Boolean(pantsSize),
  });

  const formik = useFormik({
    initialValues: {
      fullname: fullname || "",
      dateOfBirth: dateOfBirth || "",
      gender: gender || "",
      parent_name: parent_name || "",
      phone_number: phone_number || "",
      email: email || "",
      height: height,
      weight: weight,
      tShirtSize: tShirtSize || "",
      shortSize: shortSize || "",
      jacketSize: jacketSize || "",
      pantsSize: pantsSize || "",
    },
    validationSchema,
    onSubmit: (values) => {
      setFullname(values.fullname);
      setDateOfBirth(values.dateOfBirth);
      setGender(values.gender as Gender);
      setParentName(values.parent_name);
      // Auto-prefix 10-digit numbers with +1
      const normalizedPhone = values.phone_number.startsWith("+1")
        ? values.phone_number
        : `+1${values.phone_number}`;
      setPhoneNumber(normalizedPhone);
      setEmail(values.email);
      setHeight(values.height);
      setWeight(values.weight);
      setTShirtSize(values.tShirtSize as TShirtSize);
      setShortSize(values.shortSize as TShirtSize);
      setJacketSize(values.jacketSize as TShirtSize);
      setPantsSize(values.pantsSize as TShirtSize);
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

  const handleChange = (field: string, value: string) => {
    formik.setFieldValue(field, value);
  };

  return (
    <>
      {/* Form Content */}
      <div className="mb-8">
        {/* Added PracticeSchedule component here */}
        <PracticeSchedule />
        <form onSubmit={formik.handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 sm:gap-6 mt-6">
            <div>
              <FloatingLabelInput
                id="fullname"
                name="fullname"
                label="Fullname"
                type="text"
                value={formik.values.fullname}
                onChange={(e) => handleChange("fullname", e.target.value)}
                onFocus={() => handleFocus("fullname")}
                onBlur={() => handleBlur("fullname")}
                placeholder="Example: John Smith"
                isFocused={focused.fullname}
              />
              {formik.touched.fullname && formik.errors.fullname && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.fullname}
                </div>
              )}
            </div>

            <div>
              <FloatingLabelInput
                id="dateOfBirth"
                name="dateOfBirth"
                label="Date of Birth"
                type="date"
                value={formik.values.dateOfBirth}
                onChange={(e) => {
                  // Get the value directly from the date input
                  handleChange("dateOfBirth", e.target.value);
                }}
                onFocus={() => handleFocus("dateOfBirth")}
                onBlur={() => {
                  // Always keep the date field in "focused" state for label positioning
                  formik.handleBlur({ target: { name: "dateOfBirth" } });
                  setFocused({
                    ...focused,
                    dateOfBirth: true, // Always true to keep label positioned on border
                  });
                }}
                placeholder="Date of Birth"
                isFocused={true} // Always true to keep label positioned on border
              />
              {formik.touched.dateOfBirth && formik.errors.dateOfBirth && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.dateOfBirth}
                </div>
              )}
            </div>

            <div className="relative">
              <select
                id="gender"
                name="gender"
                className="w-full px-3 py-[0.851rem] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                value={formik.values.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                onFocus={() => handleFocus("gender")}
                onBlur={() => handleBlur("gender")}
              >
                <option value="" disabled hidden>
                  Gender
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              {formik.touched.gender && formik.errors.gender && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.gender}
                </div>
              )}
            </div>

            <div>
              <FloatingLabelInput
                id="parent_name"
                name="parent_name"
                label="Parent Name"
                type="text"
                value={formik.values.parent_name}
                onChange={(e) => handleChange("parent_name", e.target.value)}
                onFocus={() => handleFocus("parent_name")}
                onBlur={() => handleBlur("parent_name")}
                placeholder="Example: Jane Smith"
                isFocused={focused.parent_name}
              />
              {formik.touched.parent_name && formik.errors.parent_name && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.parent_name}
                </div>
              )}
            </div>

            <div>
              <FloatingLabelInput
                id="phone_number"
                name="phone_number"
                label="Parent phone number"
                type="tel"
                value={formik.values.phone_number}
                onChange={(e) => {
                  // Allow only an optional leading + and digits
                  const cleaned = e.target.value.replace(/[^\d+]/g, "");
                  handleChange("phone_number", cleaned);
                }}
                onFocus={() => handleFocus("phone_number")}
                onBlur={() => handleBlur("phone_number")}
                placeholder="Example: +12345678901"
                isFocused={focused.phone_number}
              />
              {formik.touched.phone_number && formik.errors.phone_number && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.phone_number}
                </div>
              )}
            </div>

            <div>
              <FloatingLabelInput
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formik.values.email}
                onChange={(e) => {
                  if (emailVerified) return;
                  handleChange("email", e.target.value);
                }}
                onFocus={() => handleFocus("email")}
                onBlur={() => handleBlur("email")}
                placeholder="Example: email@example.com"
                isFocused={focused.email || Boolean(formik.values.email)}
                disabled={emailVerified}
              />
              {emailVerified && (
                <div className="text-green-600 text-xs mt-1">
                  ✓ Verified email address
                </div>
              )}
              {formik.touched.email && formik.errors.email && (
                <div className="text-red-500 text-sm mt-1">
                  {formik.errors.email}
                </div>
              )}
            </div>

            {/* Physical attributes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FloatingLabelInput
                  id="height"
                  name="height"
                  label="Height (CM)"
                  type="number"
                  value={formik.values.height}
                  onChange={(e) => handleChange("height", e.target.value)}
                  onFocus={() => handleFocus("height")}
                  onBlur={() => {
                    // Always keep the height field in "focused" state for label positioning
                    formik.handleBlur({ target: { name: "height" } });
                    setFocused({
                      ...focused,
                      height: true // Always true to keep label positioned on border
                    });
                  }}
                  placeholder="Example: 175"
                  isFocused={true} // Always true to keep label positioned on border
                />
                {formik.touched.height && formik.errors.height && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.height}
                  </div>
                )}
              </div>

              <div>
                <FloatingLabelInput
                  id="weight"
                  name="weight"
                  label="Weight (KG)"
                  type="number"
                  value={formik.values.weight}
                  onChange={(e) => handleChange("weight", e.target.value)}
                  onFocus={() => handleFocus("weight")}
                  onBlur={() => {
                    // Always keep the weight field in "focused" state for label positioning
                    formik.handleBlur({ target: { name: "weight" } });
                    setFocused({
                      ...focused,
                      weight: true // Always true to keep label positioned on border
                    });
                  }}
                  placeholder="Example: 70"
                  isFocused={true} // Always true to keep label positioned on border
                />
                {formik.touched.weight && formik.errors.weight && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.weight}
                  </div>
                )}
              </div>
            </div>

            {/* Sizes */}
            <h3 className="text-lg font-semibold mt-4 mb-2">Clothing Sizes</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label htmlFor="tShirtSize" className="block text-sm font-medium text-gray-700 mb-1">
                  T-Shirt Size (Jersey) <span className="text-xs text-gray-500">(For youth size use: YM or YL)</span>
                </label>
                <select
                  id="tShirtSize"
                  name="tShirtSize"
                  className="w-full px-3 py-[0.851rem] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  value={formik.values.tShirtSize}
                  onChange={(e) => handleChange("tShirtSize", e.target.value)}
                  onFocus={() => handleFocus("tShirtSize")}
                  onBlur={() => handleBlur("tShirtSize")}
                >
                  <option value="" disabled hidden>
                    Select T-Shirt Size
                  </option>
                  <option value={TShirtSize.YXXS}>{TShirtSize.YXXS} (Youth XXS)</option>
                  <option value={TShirtSize.YXS}>{TShirtSize.YXS} (Youth XS)</option>
                  <option value={TShirtSize.YS}>{TShirtSize.YS} (Youth Small)</option>
                  <option value={TShirtSize.YM}>{TShirtSize.YM} (Youth Medium)</option>
                  <option value={TShirtSize.YL}>{TShirtSize.YL} (Youth Large)</option>
                  <option value={TShirtSize.YXL}>{TShirtSize.YXL} (Youth XL)</option>
                  <option value={TShirtSize.XS}>{TShirtSize.XS} (Adult XS)</option>
                  <option value={TShirtSize.S}>{TShirtSize.S} (Adult Small)</option>
                  <option value={TShirtSize.M}>{TShirtSize.M} (Adult Medium)</option>
                  <option value={TShirtSize.L}>{TShirtSize.L} (Adult Large)</option>
                  <option value={TShirtSize.XL}>{TShirtSize.XL} (Adult XL)</option>
                  <option value={TShirtSize.XXL}>{TShirtSize.XXL} (Adult XXL)</option>
                </select>
                {formik.touched.tShirtSize && formik.errors.tShirtSize && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.tShirtSize}
                  </div>
                )}
              </div>

              <div className="relative">
                <label htmlFor="shortSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Short Size
                </label>
                <select
                  id="shortSize"
                  name="shortSize"
                  className="w-full px-3 py-[0.851rem] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  value={formik.values.shortSize}
                  onChange={(e) => handleChange("shortSize", e.target.value)}
                  onFocus={() => handleFocus("shortSize")}
                  onBlur={() => handleBlur("shortSize")}
                >
                  <option value="" disabled hidden>
                    Select Short Size
                  </option>
                  <option value={TShirtSize.YXXS}>{TShirtSize.YXXS} (Youth XXS)</option>
                  <option value={TShirtSize.YXS}>{TShirtSize.YXS} (Youth XS)</option>
                  <option value={TShirtSize.YS}>{TShirtSize.YS} (Youth Small)</option>
                  <option value={TShirtSize.YM}>{TShirtSize.YM} (Youth Medium)</option>
                  <option value={TShirtSize.YL}>{TShirtSize.YL} (Youth Large)</option>
                  <option value={TShirtSize.YXL}>{TShirtSize.YXL} (Youth XL)</option>
                  <option value={TShirtSize.XS}>{TShirtSize.XS} (Adult XS)</option>
                  <option value={TShirtSize.S}>{TShirtSize.S} (Adult Small)</option>
                  <option value={TShirtSize.M}>{TShirtSize.M} (Adult Medium)</option>
                  <option value={TShirtSize.L}>{TShirtSize.L} (Adult Large)</option>
                  <option value={TShirtSize.XL}>{TShirtSize.XL} (Adult XL)</option>
                  <option value={TShirtSize.XXL}>{TShirtSize.XXL} (Adult XXL)</option>
                </select>
                {formik.touched.shortSize && formik.errors.shortSize && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.shortSize}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label htmlFor="jacketSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Jacket Size
                </label>
                <select
                  id="jacketSize"
                  name="jacketSize"
                  className="w-full px-3 py-[0.851rem] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  value={formik.values.jacketSize}
                  onChange={(e) => handleChange("jacketSize", e.target.value)}
                  onFocus={() => handleFocus("jacketSize")}
                  onBlur={() => handleBlur("jacketSize")}
                >
                  <option value="" disabled hidden>
                    Select Jacket Size
                  </option>
                  <option value={TShirtSize.YXXS}>{TShirtSize.YXXS} (Youth XXS)</option>
                  <option value={TShirtSize.YXS}>{TShirtSize.YXS} (Youth XS)</option>
                  <option value={TShirtSize.YS}>{TShirtSize.YS} (Youth Small)</option>
                  <option value={TShirtSize.YM}>{TShirtSize.YM} (Youth Medium)</option>
                  <option value={TShirtSize.YL}>{TShirtSize.YL} (Youth Large)</option>
                  <option value={TShirtSize.YXL}>{TShirtSize.YXL} (Youth XL)</option>
                  <option value={TShirtSize.XS}>{TShirtSize.XS} (Adult XS)</option>
                  <option value={TShirtSize.S}>{TShirtSize.S} (Adult Small)</option>
                  <option value={TShirtSize.M}>{TShirtSize.M} (Adult Medium)</option>
                  <option value={TShirtSize.L}>{TShirtSize.L} (Adult Large)</option>
                  <option value={TShirtSize.XL}>{TShirtSize.XL} (Adult XL)</option>
                  <option value={TShirtSize.XXL}>{TShirtSize.XXL} (Adult XXL)</option>
                </select>
                {formik.touched.jacketSize && formik.errors.jacketSize && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.jacketSize}
                  </div>
                )}
              </div>

              <div className="relative">
                <label htmlFor="pantsSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Pants Size
                </label>
                <select
                  id="pantsSize"
                  name="pantsSize"
                  className="w-full px-3 py-[0.851rem] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  value={formik.values.pantsSize}
                  onChange={(e) => handleChange("pantsSize", e.target.value)}
                  onFocus={() => handleFocus("pantsSize")}
                  onBlur={() => handleBlur("pantsSize")}
                >
                  <option value="" disabled hidden>
                    Select Pants Size
                  </option>
                  <option value={TShirtSize.YXXS}>{TShirtSize.YXXS} (Youth XXS)</option>
                  <option value={TShirtSize.YXS}>{TShirtSize.YXS} (Youth XS)</option>
                  <option value={TShirtSize.YS}>{TShirtSize.YS} (Youth Small)</option>
                  <option value={TShirtSize.YM}>{TShirtSize.YM} (Youth Medium)</option>
                  <option value={TShirtSize.YL}>{TShirtSize.YL} (Youth Large)</option>
                  <option value={TShirtSize.YXL}>{TShirtSize.YXL} (Youth XL)</option>
                  <option value={TShirtSize.XS}>{TShirtSize.XS} (Adult XS)</option>
                  <option value={TShirtSize.S}>{TShirtSize.S} (Adult Small)</option>
                  <option value={TShirtSize.M}>{TShirtSize.M} (Adult Medium)</option>
                  <option value={TShirtSize.L}>{TShirtSize.L} (Adult Large)</option>
                  <option value={TShirtSize.XL}>{TShirtSize.XL} (Adult XL)</option>
                  <option value={TShirtSize.XXL}>{TShirtSize.XXL} (Adult XXL)</option>
                </select>
                {formik.touched.pantsSize && formik.errors.pantsSize && (
                  <div className="text-red-500 text-sm mt-1">
                    {formik.errors.pantsSize}
                  </div>
                )}
              </div>
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

export default PlayerInformationForm;