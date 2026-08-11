"use client";

import { useEffect, useRef } from "react";
import { NextPage } from "next";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "framer-motion";
import { Button } from "../../atoms/Button/Button";
import AvatarGroup from "../../molecules/AvatarGroup/AvatarGroup";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const HeroSection: NextPage = () => {
  const members = [
    {
      src: "/images/person/avatars/Avatar1.png",
      alt: "Football Academy Member 1",
    },
    {
      src: "/images/person/avatars/Avatar2.png",
      alt: "Football Academy Member 2",
    },
    {
      src: "/images/person/avatars/Avatar3.png",
      alt: "Football Academy Member 3",
    },
    {
      src: "/images/person/avatars/Avatar4.png",
      alt: "Football Academy Member 4",
    },
    {
      src: "/images/person/avatars/Avatar5.png",
      alt: "Football Academy Member 5",
    },
  ];

  const router = useRouter();
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <section
      aria-label="Excel Pro Football Academy Hero Section"
      className="my-24"
    >
      <motion.div
        ref={ref}
        className="relative bg-white p-6 rounded-lg shadow-sm w-full max-w-6xl mx-auto overflow-hidden"
        initial="hidden"
        animate={controls}
        variants={containerVariants}
      >
        {/* Background image for larger screens */}
        <div className="absolute right-0 top-0 h-full w-1/2 hidden md:block">
          <Image
            src="/images/other/training.png"
            width={500}
            height={400}
            loading="eager"
            alt="Professional football training at Excel Pro Football Academy"
            className="w-full h-full object-cover rounded-r-lg"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>
        </div>

        {/* Text Content */}
        <motion.div className="relative z-10 flex flex-col gap-4 md:w-3/4">
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-gray-900"
            variants={itemVariants}
          >
            Excel Pro Soccer Academy | Professional Soccer Training for Youth
            in Toronto
          </motion.h1>

          <motion.p
            className="text-gray-600 mt-2"
            variants={itemVariants}
          >
            We believe that every player deserves a chance to succeed. Whether
            your child is just starting or already playing at a competitive
            level, Excel Pro Soccer Academy provides the training, support, and
            opportunities they need to reach their full potential.
          </motion.p>

          <motion.div
            className="flex items-center gap-4 mt-2 flex-wrap"
            variants={itemVariants}
          >
            <Button
              variant="white"
              className="rounded-xl"
              onClick={() => router.push("/program")}
              aria-label="View Excel Pro Football Academy programs"
            >
              View programs
            </Button>
            <Button
              variant="primary"
              className="rounded-xl"
              onClick={() => router.push("/program")}
              aria-label="Join Excel Pro Football Academy now"
            >
              Join now
            </Button>
            <AvatarGroup members={members} extraCount={500} />
          </motion.div>
        </motion.div>

        {/* Image for small screens */}
        <motion.div
          className="mt-6 md:hidden rounded-lg overflow-hidden"
          variants={itemVariants}
        >
          <Image
            src="/images/other/training.png"
            width={400}
            height={200}
            loading="lazy"
            alt="Professional football training session at Excel Pro Academy"
            className="w-full h-48 object-cover"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
