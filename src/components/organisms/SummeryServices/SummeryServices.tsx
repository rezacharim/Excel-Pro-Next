"use client";

import { useRef, Fragment } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import PrimaryIcon from "@/components/atoms/Icons/primaryIcons/PrimaryIcon";
import { services } from "./data";

const SummeryServices = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  // Animation variants
  const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.7, ease: "easeOut", delay: 0.1 },
    },
  };

  return (
    <>
      <motion.section
        ref={sectionRef}
        className="bg-secondary p-4 text-center"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={titleVariants}
        aria-labelledby="services-heading"
        lang="en"
        itemScope
        itemType="https://schema.org/Service"
      >
        <motion.p
          className="text-md font-semibold text-primary my-3"
          variants={titleVariants}
        >
          Our Services
        </motion.p>

        <motion.h2
          id="services-heading"
          className="text-2xl font-bold text-white my-5"
          variants={titleVariants}
          itemProp="name"
        >
          Excel Pro Academy Services
        </motion.h2>

        <div
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-x-8 justify-items-center mt-4 lg:mt-10 md:mt-8"
          itemProp="hasOfferCatalog"
          itemScope
          itemType="https://schema.org/OfferCatalog"
        >
          {services.map((service, index) => (
            <Fragment key={index}>
              <motion.div
                variants={iconVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/Offer"
              >
                <PrimaryIcon
                  icon={`/icons/${service.title}.png`}
                  text={service.title}
                  variant="light"
                  className="w-[64px] h-[64px]"
                  fontWeight="bold"
                  width={35}
                  height={35}
                />
                <meta
                  itemProp="description"
                  content={`Professional ${service.title} services offered by Excel Pro Academy.`}
                />
              </motion.div>
            </Fragment>
          ))}
        </div>

        {/* Hidden content for SEO boost */}
        <div className="sr-only">
          {services.map((service, index) => (
            <div key={`meta-${index}`}>
              <h3>{service.title}</h3>
              <p>
                Excel Pro Academy offers professional {service.title} services
                for youth soccer players in Toronto.
              </p>
            </div>
          ))}
        </div>
      </motion.section>
    </>
  );
};

export default SummeryServices;
