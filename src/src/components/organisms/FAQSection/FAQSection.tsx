"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import FAQItem from "@/components/atoms/FAQItem/FAQItem";

type FAQ = {
  id: number;
  question: string;
  answer: string;
};

type FAQSectionProps = {
  data: FAQ[];
};

const FAQSection = ({ data }: FAQSectionProps) => {
  const [openItemId, setOpenItemId] = useState<number | null>(1);
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [inView, controls]);

  const toggleItem = (id: number) => {
    setOpenItemId(openItemId === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div ref={ref}>
        <motion.h2
          className="text-center text-2xl sm:text-3xl font-bold text-primary my-6"
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Frequently Asked Questions
        </motion.h2>

        <motion.p
          className="text-center text-gray-600"
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Any questions you have about the academy can be found here.
        </motion.p>
      </div>
      <motion.div
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, y: 40 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.6, delay: 0.1 }}
        ref={ref}
      >
        <div>
          {data.map((item) => (
            <FAQItem
              key={item.id}
              question={item.question}
              answer={item.answer}
              isOpen={openItemId === item.id}
              toggleOpen={() => toggleItem(item.id)}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default FAQSection;
