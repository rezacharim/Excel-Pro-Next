import { NextPage } from "next";
import { Button } from "@/components/atoms/Button/Button";
import { useRegisterStepStore } from "@/stores/registerStepStore";
import useUserFormStore from "@/stores/UserFormStore";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Gender, TShirtSize } from "@/stores/UserFormStore/enums/enums";
import { planFromDateOfBirth } from "./Acknowledgment";
import PracticeSchedule from "./PracticeSchedule/PracticeSchedule";
import { SelectField, TextField, submitButtonClasses } from "./Fields";

const validationSchema = Yup.object({
  fullname: Yup.string()
    .trim()
    .required("Please enter the player's name")
    .max(200, "Please use 200 characters or fewer"),
  dateOfBirth: Yup.string().required("Please enter the player's date of birth"),
  gender: Yup.string().required("Please choose an option"),
  uniformSize: Yup.string().required("Please choose a uniform size"),
});

/** Uniform sizes, youth first — most players in the academy are children. */
const UNIFORM_SIZES: { value: TShirtSize; label: string }[] = [
  { value: TShirtSize.YXXS, label: "YXXS (Youth XXS)" },
  { value: TShirtSize.YXS, label: "YXS (Youth XS)" },
  { value: TShirtSize.YS, label: "YS (Youth Small)" },
  { value: TShirtSize.YM, label: "YM (Youth Medium)" },
  { value: TShirtSize.YL, label: "YL (Youth Large)" },
  { value: TShirtSize.YXL, label: "YXL (Youth XL)" },
  { value: TShirtSize.XS, label: "XS (Adult XS)" },
  { value: TShirtSize.S, label: "S (Adult Small)" },
  { value: TShirtSize.M, label: "M (Adult Medium)" },
  { value: TShirtSize.L, label: "L (Adult Large)" },
  { value: TShirtSize.XL, label: "XL (Adult XL)" },
  { value: TShirtSize.XXL, label: "XXL (Adult XXL)" },
];

const PlayerInformationForm: NextPage = () => {
  const { step, setStep } = useRegisterStepStore();
  const {
    fullname,
    dateOfBirth,
    gender,
    uniformSize,
    setFullname,
    setDateOfBirth,
    setGender,
    setUniformSize,
  } = useUserFormStore();

  const formik = useFormik({
    initialValues: {
      fullname: fullname || "",
      dateOfBirth: dateOfBirth || "",
      gender: gender || "",
      uniformSize: uniformSize || "",
    },
    validationSchema,
    onSubmit: (values) => {
      setFullname(values.fullname.trim());
      setDateOfBirth(values.dateOfBirth);
      setGender(values.gender as Gender);
      // One answer, four store fields — see setUniformSize in the store.
      setUniformSize(values.uniformSize as TShirtSize);
      setStep(step + 1);
    },
  });

  // Same age-group rule the registration uses when it saves the player, so the
  // badge can never disagree with the program the parent ends up paying for.
  const planKey = planFromDateOfBirth(formik.values.dateOfBirth);
  const programLabel = planKey ? planKey.replace("_", "–") : null;

  const errorFor = (field: keyof typeof formik.values) =>
    formik.touched[field] ? (formik.errors[field] as string | undefined) : undefined;

  return (
    <div className="mb-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">Player</h1>
      <p className="text-gray-600 mb-6 text-sm">
        Tell us who is playing. It takes about a minute.
      </p>

      <form onSubmit={formik.handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-5">
          <TextField
            id="fullname"
            name="fullname"
            label="Player's full name"
            required
            type="text"
            autoComplete="name"
            placeholder="Example: John Smith"
            value={formik.values.fullname}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={errorFor("fullname")}
          />

          <div>
            <TextField
              id="dateOfBirth"
              name="dateOfBirth"
              label="Date of birth"
              required
              type="date"
              autoComplete="bday"
              value={formik.values.dateOfBirth}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={errorFor("dateOfBirth")}
            />
            {/* Nothing is rendered for a missing or nonsensical date, so the
                badge can never read "Program: NaN". */}
            {programLabel && (
              <p className="mt-2 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-[#E43125]">
                Program: {programLabel}
              </p>
            )}
          </div>

          <SelectField
            id="gender"
            name="gender"
            label="Gender"
            required
            value={formik.values.gender}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={errorFor("gender")}
          >
            <option value="" disabled>
              Select an option
            </option>
            {Object.values(Gender).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectField>

          <SelectField
            id="uniformSize"
            name="uniformSize"
            label="Uniform size"
            required
            hint="One size is used for the jersey, shorts, jacket and pants."
            value={formik.values.uniformSize}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={errorFor("uniformSize")}
          >
            <option value="" disabled>
              Select a size
            </option>
            {UNIFORM_SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </SelectField>
        </div>

        <details className="mt-6 rounded-md border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Practice days and times
          </summary>
          <PracticeSchedule />
        </details>

        <div className="mt-8">
          <Button
            type="submit"
            className={submitButtonClasses(formik.isSubmitting)}
            disabled={formik.isSubmitting}
          >
            Next step
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PlayerInformationForm;
