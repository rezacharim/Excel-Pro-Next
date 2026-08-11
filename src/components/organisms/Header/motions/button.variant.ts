  // Button container animation variants
  export const buttonContainerVariants = {
    open: {
      display: "none",
      x: 0,
      y: 20,
      opacity: 0,
      transition: {
        duration: 0,
        ease: "easeInOut"
      },
    closed: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        duration: 0,
        ease: "easeInOut"
      }
    },
    }
  };


  // Button below menu animation variants
export const belowButtonVariants = {
    closed: {
          opacity: 0,
          y: -10,
          transition: {
            duration: 0.2,
            ease: "easeInOut"
          }
        },
    open: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.3,
            ease: "easeInOut",
            delay: 0.3
          }
        }
    };