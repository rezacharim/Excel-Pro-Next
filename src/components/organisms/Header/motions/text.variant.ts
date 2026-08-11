 // Text animation variants
 export const textVariants = {
    closed: {
      opacity: 0,
      x: -10,
      transition: {
        duration: 0,
        ease: "easeInOut"
      }
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0,
        ease: "easeInOut",
        delay: 0.1
      }
    }
  };