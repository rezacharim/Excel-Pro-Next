"use client";
import { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Testimonial from "@/components/organisms/Testimonial/Testimonial";
import { motion } from "framer-motion";
import { AnimatedSection } from "@/components/atoms/AnimatedSection/AnimatedSection";
import FixedRegisterButton from "@/components/atoms/FixedRegisterButton/FixedRegisterButton";
import { CalendarIcon, TrophyIcon, BadgeDollarSignIcon } from "lucide-react";
import { PRICING } from "@/data/programs";

interface ProgramType {
  decodedSlug: string;
  program: {
    ageGroup: string;
    title: string;
    team_image: string;
    schedule: string[];
    gameInfo: string;
    description: string;
    programOutline: {
      description: string;
      additionalDetails?: string;
    };
    playerUniformsEquipment: string;
    features?: string[];
  };
}

const ProgramDetails: NextPage<ProgramType> = ({ program, decodedSlug }) => {
  return (
    <section>
      {/* Hero Section with Staggered Animation */}
      <motion.div
        className="bg-gray-50 px-4 md:px-8 pt-4 h-[440px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          backgroundImage: 'url("/images/other/tech-bg.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "repeat",
          backgroundColor: "#FFF3F2",
        }}
      >
        <div>
          <motion.div
            className="max-w-7xl mx-auto flex items-center text-sm text-gray-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/program" className="hover:text-gray-700">
              Programs
            </Link>
            <span className="mx-2">/</span>
            <span className="text-red-500 font-medium">{decodedSlug}</span>
          </motion.div>
        </div>

        {/* Program category tag with animation */}
        <motion.div
          className="max-w-7xl mx-auto px-4 md:px-8 mt-6 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="inline-block px-3 py-1 bg-red-100 text-red-500 text-sm font-medium rounded-xl">
            Programs
          </div>
        </motion.div>

        {/* Program title with animation */}
        <motion.div
          className="max-w-7xl mx-auto px-4 md:px-8 mt-4 text-center my-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{program.title}</h1>
        </motion.div>
      </motion.div>

      {/* Program image and details with floating up animation */}
      <AnimatedSection
        className="max-w-7xl mx-auto px-4 md:px-8 mt-[-230px]"
        delay={0.8}
      >
        <div className="bg-white rounded-xl overflow-hidden shadow-sm mt-0 lg:mt-0 md:mt-6 sm:mt-6">
          <div className="relative w-full h-[500px] md:h-[550px] lg:h-[600px]">
            <Image
              src={program.team_image}
              alt={`Excel Pro ${program.ageGroup.replace(/\s*–\s*/g, "-")} players training in Markham`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-center object-cover"
              quality="100"
            />
          </div>
          {/* Schedule information overlay with staggered animations */}
          <div className="mt-6 py-8 bg-white shadow-sm rounded-xl overflow-hidden flex justify-center">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {program.schedule.map((schedule, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.2, duration: 0.6 }}
                  >
                    <div className="flex items-center justify-center w-10 h-10 mr-4 rounded-full bg-red-100 text-red-500">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">
                        {schedule}
                      </span>
                    </div>
                  </motion.div>
                ))}
                <motion.div
                  className="flex items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.5 + program.schedule.length * 0.2,
                    duration: 0.6,
                  }}
                >
                  <div className="flex items-center justify-center w-10 h-10 mr-4 rounded-full bg-red-100 text-red-500">
                    <TrophyIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">
                      {program.gameInfo}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Pricing */}
              <motion.div
                className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.7 + program.schedule.length * 0.2,
                  duration: 0.6,
                }}
              >
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-red-100 text-red-500">
                    <BadgeDollarSignIcon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-gray-900 text-lg">
                    {PRICING.price}{" "}
                    <span className="font-medium text-gray-600 text-base">
                      / {PRICING.term} ({PRICING.currency})
                    </span>
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {PRICING.registrationFeeLine}
                  <span className="block text-primary font-medium mt-1">
                    E-transfer accepted
                  </span>
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* What is it section with fade-in animations */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16">
        <div>
          {/* Banner image with scale animation */}

          {/* Content with fade-in and slide animations */}
          <AnimatedSection
            className="md:col-span-5 flex flex-col items-start mt-4"
            delay={0.2}
            direction="right"
          >
            <div className="flex justify-between items-start w-full">
              <h2 className="text-xl font-bold text-gray-900">What is it?</h2>
              <motion.svg
                className="w-6 h-6 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                whileHover={{ x: 10, transition: { duration: 0.3 } }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </motion.svg>
            </div>
            <p className="mt-4 text-gray-700">{program.description}</p>

            {program.features && program.features.length > 0 && (
              <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 w-full list-none">
                {program.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start bg-gray-50 border border-gray-100 rounded-lg p-3"
                  >
                    <span className="flex-shrink-0 w-5 h-5 mr-3 mt-0.5 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </AnimatedSection>
        </div>

        {/* Program Outline with fade-in animation */}
        <AnimatedSection className="mt-16" delay={0.3}>
          <div className="flex justify-between items-start w-full">
            <h2 className="text-xl font-bold text-gray-900">Program Outline</h2>
          </div>
          <p className="mt-4 text-gray-700">
            {program.programOutline.description}
          </p>

          <motion.div
            className="mt-6 border-l-4 border-red-500 pl-4 py-2"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-gray-700">
              {program.programOutline.additionalDetails ||
                "No additional details available."}
            </p>
          </motion.div>
        </AnimatedSection>

        {/* Uniform and Equipment with fade-in animation */}
        <AnimatedSection className="mt-16" delay={0.4} direction="up">
          <div className="flex justify-between items-start w-full">
            <h2 className="text-xl font-bold text-gray-900">
              Player Uniforms and Equipment
            </h2>
          </div>
          <p className="mt-4 text-gray-700">
            {program.playerUniformsEquipment}
          </p>
        </AnimatedSection>
      </div>

      {/* Testimonial section without animation as requested */}
      <div className="my-8">
        <Testimonial />
      </div>

      {/* Fixed Register Button */}
      <FixedRegisterButton _division={program.ageGroup} />
    </section>
  );
};

export default ProgramDetails;
