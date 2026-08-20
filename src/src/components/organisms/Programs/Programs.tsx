"use client";
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import ProgramCard from "@/components/molecules/ProgramCard/ProgramCard";
import { programs } from "./data";



const Programs = () => {

      const ref = useRef(null);
      const inView = useInView(ref, { once: true, amount: 0.3 });

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut", delay: 0.2 } },
      };

      const sectionVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut" } },
      };

  return (
    <>
        <motion.div
        ref={ref}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={sectionVariants}
      >
        {programs.map((program, index) => (
          <motion.div key={index} variants={cardVariants}>
            <ProgramCard
              ageGroup={program.ageGroup}
              title={program.title}
              backgroundClass={program.backgroundClass}
              textColorClass={program.textColorClass}
              schedule={program.schedule}
              gameInfo={program.gameInfo}
              tag={program.tag}
              imageSrc={program.imageSrc}
            />
          </motion.div>
        ))}
      </motion.div>
    </>
  )
}

export default Programs;