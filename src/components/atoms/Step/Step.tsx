import { NextPage } from "next";

type StepProps = {
    number: number;
    title: string;
    isActive: boolean;
  };
  
  const Step: NextPage<StepProps> = ({ number, title, isActive }) => {
    return (
      <div className="flex flex-col items-center">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            isActive ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          {number}
        </div>
        <div className="text-center mt-2 text-sm font-bold">{title}</div>
      </div>
    );
  };

  export default Step;