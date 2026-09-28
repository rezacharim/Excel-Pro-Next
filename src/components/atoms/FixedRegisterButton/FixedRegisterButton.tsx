"use client";
import { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useDivisionStore } from "@/stores/divisionStore";
import { motion } from "framer-motion";
import { Button } from "../Button/Button";
import { groupByKey, registerHref } from "@/data/academy";

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


  // Goes wherever this season registers (see ACTIVE_SEASON in
  // src/data/academy.ts): /indoor with the group pre-selected in the indoor
  // season, the membership form at /register in the outdoor season.
  const handleRegister = () => {
    const cleanedDivision = normalizeDivision(decodedSlug);
    setDivision(cleanedDivision);
    router.push(registerHref(groupByKey(cleanedDivision)));
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
