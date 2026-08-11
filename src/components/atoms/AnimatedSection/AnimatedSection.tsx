import { ReactNode, useRef } from "react";
import { useInView, motion } from "framer-motion";


export const AnimatedSection = ({ children, className, delay = 0, direction = "up" }: { children: ReactNode; className?: string; delay?: number; direction?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });
    
    const variants = {
      hidden: {
        opacity: 0,
        y: direction === "up" ? 50 : direction === "down" ? -50 : 0,
        x: direction === "left" ? 50 : direction === "right" ? -50 : 0,
      },
      visible: {
        opacity: 1,
        y: 0,
        x: 0,
        transition: {
          duration: 0.8,
          delay: delay,
          ease: [0.25, 0.1, 0.25, 1.0]
        }
      }
    };
  
    return (
      <motion.div
        ref={ref}
        variants={variants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className={className}
      >
        {children}
      </motion.div>
    );
  };