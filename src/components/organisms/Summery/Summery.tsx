"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import PrimaryIcon from "@/components/atoms/Icons/primaryIcons/PrimaryIcon";
import Script from "next/script";

const Summary = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  const [studentCount, setStudentCount] = useState(0);
  const [experienceCount, setExperienceCount] = useState(0);
  const [coachesCount, setCoachesCount] = useState(0);
  const [awardsCount, setAwardsCount] = useState(0);

  const targets = {
    students: 500,
    experience: 18,
    coaches: 12,
    awards: 10,
  };

  useEffect(() => {
    if (isInView) {
      const duration = 4000;
      const interval = 30;
      const studentsStep = targets.students / (duration / interval);
      const experienceStep = targets.experience / (duration / interval);
      const coachesStep = targets.coaches / (duration / interval);
      const awardsStep = targets.awards / (duration / interval);

      const timer = setInterval(() => {
        setStudentCount((prev) =>
          Math.min(prev + studentsStep, targets.students)
        );
        setExperienceCount((prev) =>
          Math.min(prev + experienceStep, targets.experience)
        );
        setCoachesCount((prev) =>
          Math.min(prev + coachesStep, targets.coaches)
        );
        setAwardsCount((prev) => Math.min(prev + awardsStep, targets.awards));
      }, interval);

      const cleanup = setTimeout(() => {
        clearInterval(timer);
        setStudentCount(targets.students);
        setExperienceCount(targets.experience);
        setCoachesCount(targets.coaches);
        setAwardsCount(targets.awards);
      }, duration);

      return () => {
        clearInterval(timer);
        clearTimeout(cleanup);
      };
    }
  }, [
    isInView,
    targets.awards,
    targets.coaches,
    targets.experience,
    targets.students,
  ]);

  // Optimizing animations to reduce Web Vitals impact
  const containerVariants = {
    hidden: { opacity: 0, y: 20 }, // reduced y value for better performance
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8, // reduced duration
        ease: "easeOut",
        staggerChildren: 0.15, // reduced for better performance
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 }, // reduced y value
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" }, // reduced duration
    },
  };

  const iconVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 }, // reduced values for better performance
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.8, ease: "easeOut" }, // reduced duration
    },
  };

  const formatCount = (count: number, isInteger = true) => {
    return `+${isInteger ? Math.floor(count) : count.toFixed(1)}`;
  };

  // Define schema.org JSON-LD for the soccer academy
  const academySchema = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: "Excel Pro Soccer Academy",
    description:
      "Excel Pro Soccer Academy is the largest Iranian-based soccer academy in Toronto, founded and led by former Iran National Team and Persepolis FC player, Reza Abedian.",
    sport: "Soccer",
    memberOf: {
      "@type": "Organization",
      name: "Toronto Soccer Association",
    },
    coach: {
      "@type": "Person",
      name: "Reza Abedian",
      jobTitle: "Head Coach",
      alumniOf: {
        "@type": "SportsTeam",
        name: "Persepolis FC",
      },
    },
    numberOfEmployees: targets.coaches,
    award: `${targets.awards} soccer awards`,
    foundingDate: `${new Date().getFullYear() - targets.experience}`,
  };

  return (
    <>
      {/* Adding structured data using JSON-LD */}
      <Script
        id="academy-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(academySchema) }}
      />

      <motion.section
        ref={sectionRef}
        className="lg:p-28 py-8 px-4 w-full bg-[#F9F9F9] mt-9"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={containerVariants}
        aria-labelledby="academy-summary-heading"
        lang="en" // Set language attribute for better SEO
        itemScope
        itemType="https://schema.org/SportsTeam"
      >
        <div className="mb-12">
          <motion.h2
            id="academy-summary-heading"
            className="text-3xl font-bold text-gray-800 mb-6"
            variants={itemVariants}
            itemProp="name"
          >
            Welcome to Excel Pro Soccer Academy — Developing Future Stars
          </motion.h2>

          <motion.p
            className="text-gray-600 mb-6 leading-relaxed"
            variants={itemVariants}
            itemProp="description"
          >
            At Excel Pro Soccer Academy we provide elite soccer training for
            boys and girls aged 5 to 18. Based in Markham, Ontario and serving
            Toronto and the entire GTA, our academy focuses on developing
            technical skills, game intelligence, and a lifelong passion for
            soccer.
          </motion.p>

          <motion.div variants={itemVariants}>
            <Link
              href="/about-us"
              aria-label="Learn more about Excel Pro Soccer Academy"
              title="Learn more about Excel Pro Soccer Academy"
              className="inline-flex items-center text-gray-700 hover:text-primary text-lg font-semibold transition-all duration-300 justify-center group"
              rel="canonical" // Add canonical relation for SEO
            >
              Learn More
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-3 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true" // Hide from screen readers as it's decorative
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7-7 7M5 12h16"
                />
              </svg>
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
        >
          <motion.div variants={iconVariants}>
            <PrimaryIcon
              number={formatCount(studentCount)}
              text="Students"
              variant="dark"
              icon="/icons/football_player.png"
              width={150}
              height={150}
            />
          </motion.div>

          <motion.div variants={iconVariants}>
            <PrimaryIcon
              number={formatCount(experienceCount)}
              text="Years of Experience"
              variant="dark"
              width={150}
              height={150}
              icon="/icons/trophy.png"
            />
          </motion.div>

          <motion.div variants={iconVariants}>
            <PrimaryIcon
              number={formatCount(coachesCount)}
              text="Professional Coaches"
              variant="dark"
              icon="/icons/Coaches.png"
              width={150}
              height={150}
            />
          </motion.div>

          <motion.div variants={iconVariants}>
            <PrimaryIcon
              number={formatCount(awardsCount)}
              text="Awards Won"
              variant="dark"
              icon="/icons/cup.png"
              width={150}
              height={150}
            />
          </motion.div>
        </motion.div>
      </motion.section>
    </>
  );
};

export default Summary;
