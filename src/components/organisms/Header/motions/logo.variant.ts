  // Logo container animation variants
  export const logoContainerVariants = {
    closed: {
      justifyContent: "center",
      flex: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    open: {
      justifyContent: "flex-start",
      flex: "auto",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };