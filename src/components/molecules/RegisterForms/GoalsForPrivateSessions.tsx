// import { useState } from "react";
// import { NextPage } from "next";
// import { Button } from "@/components/atoms/Button/Button";
// import { useRegisterStepStore } from "@/stores/registerStepStore";
// import FloatingLabelInput from "@/components/organisms/FloatingLabelInput/FloatingLabelInput";
// import useUserFormStore from "@/stores/UserFormStore";
// import { useFormik } from "formik";
// import * as Yup from "yup";

// const validationSchema = Yup.object({
//   session_goals: Yup.string().required("Please describe your goals for these sessions"),
// });

// const GoalsForPrivateSessions: NextPage = () => {
//   const { setStep, step } = useRegisterStepStore();
//   const { session_goals, setSessionGoals } = useUserFormStore();

//   const [focused, setFocused] = useState({
//     session_goals: Boolean(session_goals),
//   });

//   const formik = useFormik({
//     initialValues: {
//       session_goals: session_goals || "",
//     },
//     validationSchema,
//     onSubmit: (values) => {
//       setSessionGoals(values.session_goals);
//       setStep(step + 1);
//     },
//   });

//   const handleFocus = (field: string) => {
//     setFocused({
//       ...focused,
//       [field]: true,
//     });
//   };

//   const handleBlur = (field: string) => {
//     formik.handleBlur({ target: { name: field } });
//     setFocused({
//       ...focused,
//       [field]: formik.values[field as keyof typeof formik.values] !== "",
//     });
//   };

//   return (
//     <>
//       {/* Form Content */}
//       <div className="mb-8">
//         <h1 className="text-xl sm:text-2xl font-bold mb-4">
//           What do you hope to achieve in these sessions?
//         </h1>
//         <p className="text-gray-600 mb-4">
//           Please share your specific goals and expectations for these private soccer sessions.
//           This will help us tailor the training to meet your needs.
//         </p>

//         <form onSubmit={formik.handleSubmit}>
//           <div className="mt-6">
//             <FloatingLabelInput
//               id="session_goals"
//               name="session_goals"
//               label="Your Goals"
//               type="text"
//               value={formik.values.session_goals}
//               onChange={formik.handleChange}
//               onFocus={() => handleFocus("session_goals")}
//               onBlur={() => handleBlur("session_goals")}
//               placeholder="Example: I want to improve my ball control, develop better shooting techniques, enhance my defensive skills, etc."
//               isFocused={focused.session_goals}
//             />
//             {formik.touched.session_goals && formik.errors.session_goals && (
//               <div className="text-red-500 text-sm mt-1">{formik.errors.session_goals}</div>
//             )}
//           </div>

//           <div className="mt-2 text-sm text-gray-500">
//             Be specific about skills you want to improve, fitness goals, or any particular aspects
//             of the game you&apos;d like to focus on during your sessions.
//           </div>

//           {/* Next Button */}
//           <div className="mt-8">
//             <Button
//               type="submit"
//               className={`font-medium w-full py-3 rounded-md ${
//                 !formik.values.session_goals
//                   ? "bg-red-400 cursor-not-allowed"
//                   : "bg-red-600 hover:bg-red-700 text-white"
//               }`}
//               disabled={!formik.values.session_goals}
//             >
//               Next step
//             </Button>
//           </div>
//         </form>
//       </div>
//     </>
//   );
// };

// export default GoalsForPrivateSessions;