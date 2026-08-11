import { motion, useAnimation } from "framer-motion";
import { useRef, useEffect } from "react";
import { useInView } from "framer-motion";
import ContactCard from "@/components/molecules/ContactCard/ContactCard";

const ContactInfoSection = () => {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
  
    useEffect(() => {
      if (isInView) {
        controls.start("visible");
      }
    }, [isInView, controls]);
  
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4 px-4 sm:px-6 max-w-7xl mx-auto mb-12"
      >
        <ContactCard
          iconSrc="/icons/location-marker.png"
          title="Location"
          content="Ontario, Canada"
        />
        <ContactCard
          iconSrc="/icons/phone.png"
          title="Telephone"
          content="+1 647-703-7821"
        />
        <ContactCard
          iconSrc="/icons/location-marker.png"
          title="Email"
          content="excelprosocceracademy@gmail.com"
        />
      </motion.div>
    );
  };
  
  export default ContactInfoSection;