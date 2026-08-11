// import { NextPage } from "next";
// import { Button } from "@/components/atoms/Button/Button";
// import { useRegisterStepStore } from "@/stores/registerStepStore";
// import useUserFormStore from "@/stores/UserFormStore";
// import { useFormik } from "formik";
// import * as Yup from "yup";
// import { AvailableDays, PreferredTime } from "@/stores/UserFormStore/enums/enums";

// const validationSchema = Yup.object({
//   available_days: Yup.string().required("Available days are required"),
//   preferred_time: Yup.string().required("Preferred time is required"),
// });

// const Availability: NextPage = () => {
//   const { setStep, step } = useRegisterStepStore();
//   const { 
//     available_days, 
//     preferred_time,
//     setAvailableDays,
//     setPreferredTime 
//   } = useUserFormStore();

//   const formik = useFormik({
//     initialValues: {
//       available_days: available_days || AvailableDays.MONDAY,
//       preferred_time: preferred_time || PreferredTime.MORNING,
//     },
//     validationSchema,
//     onSubmit: (values) => {
//       setAvailableDays(values.available_days as AvailableDays);
//       setPreferredTime(values.preferred_time as PreferredTime);
//       setStep(step + 1);
//     },
//   });

//   return (
//     <>
//       {/* Form Content */}
//       <div className="mb-8">
//         <h1 className="text-xl sm:text-2xl font-bold mb-4">
//           Preferred Time Slots?
//         </h1>
//         <p className="text-gray-600 mb-4">
//           Please select your available days and preferred time slots for your private soccer sessions.
//         </p>

//         <form onSubmit={formik.handleSubmit}>
//           <div className="mt-6 mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Available Days
//             </label>
//             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
//               {Object.values(AvailableDays).map((day) => (
//                 <div key={day} className="relative">
//                   <input
//                     type="radio"
//                     id={`day_${day}`}
//                     name="available_days"
//                     value={day}
//                     checked={formik.values.available_days === day}
//                     onChange={formik.handleChange}
//                     className="sr-only"
//                   />
//                   <label
//                     htmlFor={`day_${day}`}
//                     className={`block w-full px-4 py-3 text-center rounded-md cursor-pointer border ${
//                       formik.values.available_days === day
//                         ? "border-red-600 bg-red-50 text-red-600"
//                         : "border-gray-300 hover:border-gray-400"
//                     }`}
//                   >
//                     {day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()}
//                   </label>
//                 </div>
//               ))}
//             </div>
//             {formik.touched.available_days && formik.errors.available_days && (
//               <div className="text-red-500 text-sm mt-1">{formik.errors.available_days}</div>
//             )}
//           </div>

//           <div className="mt-6 mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Preferred Time
//             </label>
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//               {Object.values(PreferredTime).map((time) => (
//                 <div key={time} className="relative">
//                   <input
//                     type="radio"
//                     id={`time_${time}`}
//                     name="preferred_time"
//                     value={time}
//                     checked={formik.values.preferred_time === time}
//                     onChange={formik.handleChange}
//                     className="sr-only"
//                   />
//                   <label
//                     htmlFor={`time_${time}`}
//                     className={`block w-full px-4 py-3 text-center rounded-md cursor-pointer border ${
//                       formik.values.preferred_time === time
//                         ? "border-red-600 bg-red-50 text-red-600"
//                         : "border-gray-300 hover:border-gray-400"
//                     }`}
//                   >
//                     {time.charAt(0).toUpperCase() + time.slice(1).toLowerCase()}
//                   </label>
//                 </div>
//               ))}
//             </div>
//             {formik.touched.preferred_time && formik.errors.preferred_time && (
//               <div className="text-red-500 text-sm mt-1">{formik.errors.preferred_time}</div>
//             )}
//           </div>

//           <div className="mt-2 text-sm text-gray-500">
//             We&apos;ll do our best to accommodate your preferred schedule. Our coach will contact you to confirm availability.
//           </div>

//           {/* Next Button */}
//           <div className="mt-8">
//             <Button
//               type="submit"
//               className={`font-medium w-full py-3 rounded-md ${
//                 !formik.values.available_days || !formik.values.preferred_time
//                   ? "bg-red-400 cursor-not-allowed"
//                   : "bg-red-600 hover:bg-red-700 text-white"
//               }`}
//               disabled={!formik.values.available_days || !formik.values.preferred_time}
//             >
//               Next step
//             </Button>
//           </div>
//         </form>
//       </div>
//     </>
//   );
// };

// export default Availability;