"use client";
import { useRegisterStepStore } from "@/stores/registerStepStore";
import Step from "@/components/atoms/Step/Step";
import { steps } from "./data";
// import PaymentPage from "../../StripeElement/PaymentPage";
import Etransfer from "../../Etransfer/Etransfer";

const RegisterForm = () => {
  const { step } = useRegisterStepStore();
  const currentStep = step < 1 || step > steps.length ? 1 : step;
  const currentStepInfo = steps[currentStep - 1];


  if (step > 5) {
    return (
      <div className="my-12 flex items-center justify-center">
        <Etransfer />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 bg-white overflow-x-hidden">
      {/* Progress Bar */}
      <div className="mb-12 relative">
        {/* Connecting Line (goes behind steps) */}
        <div className="absolute top-4 left-11 right-11 h-px bg-gray-300 z-0" />

        {/* Steps circles and labels */}
        <div className="flex justify-between overflow-x-auto gap-4 z-10 relative">
          {steps.map((stepItem) => (
            <div
              key={stepItem.number}
              className="flex flex-col items-center min-w-[80px] flex-shrink-0"
            >
              <Step
                number={stepItem.number}
                title={stepItem.title}
                isActive={stepItem.number === currentStep}
              />
              <div className="text-xs text-gray-600 mt-1 text-center font-semibold">
                {stepItem.subtitle}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Contents */}
      {currentStepInfo.component}
    </div>
  );
};

export default RegisterForm;
