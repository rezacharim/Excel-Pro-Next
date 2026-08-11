"use client";

import { NextPage } from "next";
import { motion, useInView } from "framer-motion";
import ProgramCard from "@/components/molecules/ProgramCard/ProgramCard";
import { Button } from "@/components/atoms/Button/Button";
import { programs } from "./data";
import { useRef } from "react";
import Link from "next/link";

const SummeryPrograms: NextPage = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const displayedPrograms = programs.slice(0, 3);

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.7, ease: "easeOut", delay: 0.1 },
    },
  };

  return (
    <>
      <motion.section
        ref={ref}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={sectionVariants}
        className="py-12 px-4 max-w-7xl mx-auto"
        aria-labelledby="programs-heading"
        lang="en"
      >
        <div className="flex justify-between items-center mb-10">
          <h2
            id="programs-heading"
            className="text-md lg:text-4xl md:text-2xl sm:text-md font-bold text-gray-900"
          >
            Our Programs
          </h2>

          <Link
            href="/program"
            passHref
            legacyBehavior
            aria-label="View all soccer training programs"
            title="View all Excel Pro Academy soccer programs"
            className="inline-block"
          >
            <Button
              variant="white"
              className="rounded-xl font-normal flex items-center mx-2"
            >
              View all programs
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-1"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>

        <motion.ul
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={sectionVariants}
        >
          {displayedPrograms.map((program, index) => (
            <motion.li key={index} variants={cardVariants}>
              <ProgramCard
                ageGroup={program.ageGroup}
                backgroundClass={program.backgroundClass}
                textColorClass={program.textColorClass}
                schedule={program.schedule}
                gameInfo={program.gameInfo}
                tag={program.tag}
                imageSrc={program.imageSrc}
              />
            </motion.li>
          ))}
        </motion.ul>
      </motion.section>
    </>
  );
};

export default SummeryPrograms;
