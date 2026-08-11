import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface AnimatedCardProps {
  children: React.ReactNode;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ children }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
