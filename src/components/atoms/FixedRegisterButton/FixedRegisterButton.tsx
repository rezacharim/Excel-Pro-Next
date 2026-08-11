"use client";
import { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useDivisionStore } from "@/stores/divisionStore";
import { motion } from "framer-motion";
import { Button } from "../Button/Button";

interface FixedRegisterButtonProps {
  _division: string;
}

const FixedRegisterButton: NextPage<FixedRegisterButtonProps> = ({
  _division,
}) => {
  const { setDivision } = useDivisionStore();
  const router = useRouter();

  const decodedSlug = decodeURIComponent(_division).replace(/–/g, "-");



  const normalizeDivision = (str: string): string =>
    str
      .toLowerCase()
      .replace(/\s*–\s*/g, '-')
      .replace(/\s*-\s*/g, '-')
      .replace(/\s+/g, '');


      console.log("Normalized Division:", normalizeDivision(decodedSlug));
      

      const handleRegister = () => {
        const cleanedDivision = normalizeDivision(decodedSlug);
        setDivision(cleanedDivision);
        router.push(`/register`);
      };

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5 }}
    >
      <Button
        onClick={() => handleRegister()}
        className="text-white font-medium rounded-full shadow-lg flex items-center transform hover:scale-105"
      >
        <span>Register for this program</span>
        <svg
          className="w-5 h-5 ml-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      </Button>
    </motion.div>
  );
};

export default FixedRegisterButton;
