"use client";
import { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { useRegisterStepStore } from "@/stores/registerStepStore";

const Header: NextPage = () => {
  const { setStep, step } = useRegisterStepStore();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm py-4 px-6">
      <div className="container mx-auto">
        <div className="flex items-center">
          <div className="flex items-center mr-4 cursor-pointer">
            <div
              onClick={() => setStep(step - 1)}
              className={`text-gray-600 hover:text-gray-800 ${
                step === 1 || step > 5 ? "hidden" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-arrow-left"
              >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </div>
          </div>

          <div className="flex items-center">
            <div className="h-10 w-10 mr-2">
              <Link href="/program">
                <Image
                  src="/images/logo/excelpro_logo_2.png"
                  alt="Excel Pro Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </Link>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Excel Pro</h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
