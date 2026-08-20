"use client";

import { Fragment, useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { IoTrophy } from "react-icons/io5";
import { GiSoccerField, GiSoccerBall } from "react-icons/gi";
import {
  FaChalkboardTeacher,
  FaUserGraduate,
  FaHandshake,
} from "react-icons/fa";

// Updated service data for sports organization
const services = [
  {
    title:
      "Compete in top-tier leagues and tournaments across Toronto and the GTA",
    icon: IoTrophy,
  },
  {
    title: "Licensed and experienced coaching staff",
    icon: FaChalkboardTeacher,
  },
  {
    title: "Individual player development plans",
    icon: FaUserGraduate,
  },
  {
    title: "Emphasis on discipline, respect, and sportsmanship",
    icon: FaHandshake,
  },
];

const WhyChooseUs = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 50, damping: 9 },
    },
  };

  const circleVariants = {
    hidden: { opacity: 0, scale: 0.2, rotate: -90 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { duration: 1.2, ease: "easeOut" },
    },
  };

  return (
    <section
      ref={sectionRef}
      className="w-full max-w-6xl mx-auto bg-[#FAFAFA] p-4 text-center rounded-xl relative overflow-hidden"
    >
      <motion.div
        className="absolute top-0 left-0 w-24 h-24 md:w-32 md:h-32"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={circleVariants}
      >
        <Image
          src="/images/other/red-semi-circle.png"
          alt="Red semi-circle decorative element"
          width={80}
          height={80}
          className="object-contain"
          priority
        />
      </motion.div>

      <motion.h2
        className="text-2xl font-bold text-[#181D27] mt-10 mb-2 relative z-10"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={titleVariants}
      >
        Why Choose Us?
      </motion.h2>

      <motion.p
        className="text-lg font-medium text-gray-600 mb-10 italic relative z-10"
        initial={{ opacity: 0 }}
        animate={
          isInView
            ? { opacity: 1, transition: { delay: 0.4, duration: 1 } }
            : { opacity: 0 }
        }
      >
        Join a winning culture. Train with purpose. Play with passion.
      </motion.p>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-10 justify-items-center mt-8 relative z-10"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={containerVariants}
      >
        {services.map((service, index) => (
          <Fragment key={index}>
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
              className="flex flex-col items-center"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-500 to-green-500 rounded-full shadow-md mb-3 text-white overflow-hidden">
                  <service.icon size={32} />
                </div>
                <p className="text-sm font-medium text-gray-800 text-center max-w-xs">
                  {service.title}
                </p>
              </div>
            </motion.div>
          </Fragment>
        ))}
      </motion.div>

      <motion.div
        className="absolute bottom-0 right-0 w-32 h-32 opacity-30"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: isInView ? 0.3 : 0,
          scale: isInView ? 1 : 0.5,
          transition: { duration: 1.5, delay: 0.8 },
        }}
      >
        <GiSoccerField size={128} color="#0070f3" />
      </motion.div>

      <motion.div
        className="absolute top-20 right-10 w-16 h-16 opacity-20"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: isInView ? 0.2 : 0,
          scale: isInView ? 1 : 0.5,
          transition: { duration: 1.5, delay: 1 },
        }}
      >
        <GiSoccerBall size={64} color="#ff4081" />
      </motion.div>
    </section>
  );
};

export default WhyChooseUs;
