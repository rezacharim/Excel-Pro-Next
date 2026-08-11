"use client";
import { NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import "swiper/css";
import "swiper/css/navigation";
import { Button } from "@/components/atoms/Button/Button";
import PrimaryIcon from "@/components/atoms/Icons/primaryIcons/PrimaryIcon";
import SummeryServices from "@/components/organisms/SummeryServices/SummeryServices";
import TeamSlider from "../../organisms/TeamSlider/TeamSlider";
import TeamSection from "@/components/molecules/TeamSection/TeamSection";

interface AboutSectionProps {
  teamImages: {
    id: string;
    title: string;
    file_name: string;
    storage_filename: string;
    image_url: string;
    file_path: string;
    mime_type: string;
    file_size: number;
    caption: string | null;
    created_at?: string;
    updated_at?: string;
  }[];
}

// Animation variants for different sections
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const AboutSection: NextPage<AboutSectionProps> = ({ teamImages }) => {
  // Refs for sections to detect viewport entry
  const aboutSectionRef = useRef(null);
  const statsRef = useRef(null);
  const servicesRef = useRef(null);
  const teamSectionRef = useRef(null);
  const router = useRouter();

  // Check if sections are in view
  const isAboutInView = useInView(aboutSectionRef, { once: true, amount: 0.3 });
  const isStatsInView = useInView(statsRef, { once: true, amount: 0.3 });
  const isServicesInView = useInView(servicesRef, { once: true, amount: 0.1 });
  const isTeamInView = useInView(teamSectionRef, { once: true, amount: 0.1 });

  return (
    <>
      {/* Header */}
      <motion.div
        className="bg-[#FFF3F2] bg-[url('/images/other/tech-bg.png')] bg-cover bg-center px-4 sm:px-6 lg:px-8 pt-8 pb-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="flex items-center text-sm text-gray-500 my-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-red-500 font-medium">About Us</span>
          </motion.div>

          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <motion.span
              className="inline-block px-3 py-1 bg-red-100 text-red-500 text-sm font-medium rounded-xl mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Programs
            </motion.span>
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              Learn more about us
            </motion.h1>
          </motion.div>
        </div>
      </motion.div>

      {/* Slider */}
      <div className="w-full py-8 relative overflow-hidden -mt-[120px] sm:-mt-[130px] md:-mt-[150px]">
        <div className="relative z-10">
          <div className="relative">
            <div className="absolute left-0 top-0 h-full w-16 sm:w-24 md:w-32 lg:w-48 z-10 bg-gradient-to-r from-white/70 to-transparent" />

            {/* Team Slider with fade-in animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <TeamSlider teamImages={teamImages} />
            </motion.div>

            <div className="absolute right-0 top-0 h-full w-16 sm:w-24 md:w-32 lg:w-48 z-10 bg-gradient-to-l from-white/70 to-transparent" />
          </div>
        </div>
      </div>

      {/* About Us Section */}
      <div
        ref={aboutSectionRef}
        className="w-full flex flex-col md:flex-row gap-8 md:gap-16 items-start py-16 md:py-24"
      >
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start w-full">
          {/* Left side with animated image and cards */}
          <motion.div
            className="w-full md:w-1/2 relative pl-0 md:pl-0 md:ml-0"
            variants={fadeInLeft}
            initial="hidden"
            animate={isAboutInView ? "visible" : "hidden"}
          >
            <div className="relative w-full">
              {/* Top white card */}
              <motion.div
                className="absolute -top-10 left-0 right-20 h-24 bg-gray-50 rounded-3xl z-0"
                initial={{ opacity: 0, y: -20 }}
                animate={
                  isAboutInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }
                }
                transition={{ duration: 0.7, delay: 0.2 }}
              ></motion.div>

              <motion.div
                className="absolute top-0 bottom-20 -right-6 w-24 h-full bg-gray-50 rounded-3xl z-0"
                initial={{ opacity: 0, x: 20 }}
                animate={
                  isAboutInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }
                }
                transition={{ duration: 0.7, delay: 0.3 }}
              ></motion.div>

              {/* Main image */}
              <motion.div
                className="relative w-full z-10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={
                  isAboutInView
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.95 }
                }
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Image
                  src="/images/person/team/u7.webp"
                  alt="Excel Pro Soccer Team"
                  width={629}
                  height={445}
                  className="rounded-r-3xl w-full h-auto"
                  priority={true}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Right side text */}
          <motion.div
            className="w-full md:w-1/2 px-4 md:px-0 md:pr-4"
            variants={fadeInRight}
            initial="hidden"
            animate={isAboutInView ? "visible" : "hidden"}
          >
            <motion.h2
              className="text-red-500 font-bold uppercase mb-4"
              initial={{ opacity: 0 }}
              animate={isAboutInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              ABOUT US
            </motion.h2>

            <motion.h3
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 break-words"
              initial={{ opacity: 0, y: 30 }}
              animate={
                isAboutInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
              }
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              WELCOME TO Excel Pro Soccer
            </motion.h3>

            <motion.div
              className="text-gray-700 space-y-4"
              initial={{ opacity: 0 }}
              animate={isAboutInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <p className="break-words max-w-full">
                At Excel Pro Soccer Academy, we are committed to building the
                next generation of soccer players through structured training,
                competitive opportunities, and a positive team culture. Based in
                Toronto and active throughout the Greater Toronto Area (GTA),
                our academy welcomes players aged 5 to 18, from beginners to
                high-level athletes.
              </p>
              <p className="break-words max-w-full">
                With a team of certified, passionate coaches, we combine
                European-style training with Canadian grassroots development
                models to give every player the tools they need to grow — both
                on and off the field.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={
                isAboutInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Button
                className="mt-8 text-white font-medium py-3 px-6 rounded-lg transition duration-300"
                onClick={() => router.push("program")}
              >
                ENTER A SOCCER WORLD
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        ref={statsRef}
        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 px-4 sm:px-6 lg:px-8 bg-[#F9F9F9] py-16"
        variants={staggerChildren}
        initial="hidden"
        animate={isStatsInView ? "visible" : "hidden"}
      >
        <motion.div variants={fadeInUp}>
          <PrimaryIcon
            number="+500"
            text="Student"
            variant="dark"
            icon="/icons/football_player.png"
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <PrimaryIcon
            number="+18"
            text="Years of experience"
            variant="dark"
            icon="/icons/trophy.png"
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <PrimaryIcon
            number="+12"
            text="Coaches"
            variant="dark"
            icon="/icons/Coaches.png"
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <PrimaryIcon
            number="+10"
            text="Awards"
            variant="dark"
            icon="/icons/cup.png"
          />
        </motion.div>
      </motion.div>

      {/* Services Section with wrapper for animations */}
      <motion.div
        ref={servicesRef}
        initial={{ opacity: 0 }}
        animate={isServicesInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <SummeryServices />
      </motion.div>

      {/* Team Section with wrapper for animations */}
      <motion.div
        ref={teamSectionRef}
        initial={{ opacity: 0, y: 50 }}
        animate={isTeamInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 1 }}
      >
        <TeamSection />
      </motion.div>
    </>
  );
};

export default AboutSection;
