"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../atoms/Button/Button";
import Menu from "../../molecules/Menu/Menu";
import TopBar from "@/components/molecules/TopBar/TobBar";

// Animation variants
import { menuVariants } from "./motions/menu.variant";
import {
  belowButtonVariants,
  buttonContainerVariants,
} from "./motions/button.variant";
import { logoContainerVariants } from "./motions/logo.variant";
import { textVariants } from "./motions/text.variant";

// logo component
import Logo from "../../atoms/Logo/Logo";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Variants for header layout changes
  const headerVariants = {
    closed: {
      justifyContent: "space-between",
    },
    open: {
      justifyContent: "space-between",
    },
  };

  return (
    <header className="fixed w-full z-50">
      <TopBar />
      <div className="w-full px-4 lg:px-14 md:px-8 py-3 shadow-md bg-white">
        <div className="container mx-auto">
          {/* Desktop View - Hidden on Mobile */}
          <div className="hidden md:flex items-center justify-between">
            {/* Logo - Left */}
            <div className="flex-1">
              <figure
                className="cursor-pointer w-fit"
                onClick={() => router.push("/")}
              >
                <Logo />
              </figure>
            </div>

            {/* Menu - Center */}
            <div className="flex-1 flex justify-center mr-0 md:mr-5">
              <Menu />
            </div>

            {/* Button - Right */}
            <div className="flex-1 flex justify-end">
              <Button
                className="rounded-xl"
                onClick={() => router.push("/program")}
              >
                Enroll now
              </Button>
            </div>
          </div>

          {/* Mobile View - Hidden on Desktop */}
          <motion.div
            className="flex md:hidden items-center"
            variants={headerVariants}
            animate={isMenuOpen ? "open" : "closed"}
          >
            {/* Button (visible only when menu is closed) */}
            <motion.div
              className={`flex-1 flex justify-start ${
                isMenuOpen ? "flex-none" : ""
              }`}
              variants={buttonContainerVariants}
              animate={isMenuOpen ? "open" : "closed"}
              initial="closed"
            >
              <Button
                className="rounded-xl"
                onClick={() => router.push("/program")}
              >
                Enroll now
              </Button>
            </motion.div>

            {/* Logo - Center when closed, Left when open */}
            <motion.div
              className="flex items-center"
              variants={logoContainerVariants}
              animate={isMenuOpen ? "open" : "closed"}
              initial="closed"
            >
              <figure
                className="cursor-pointer w-fit"
                onClick={() => router.push("/")}
              >
                <Logo />
              </figure>

              {/* "Excel Pro Academy" text - appears when menu is open */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.span
                    className="ml-2 font-semibold text-lg text-primary"
                    variants={textVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                  >
                    Excel Pro Academy
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Hamburger Menu - Right */}
            <div className={isMenuOpen ? "" : "flex-1 flex justify-end"}>
              <button
                className="flex flex-col justify-center items-center"
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                <span
                  className={`block w-6 h-0.5 bg-black mb-1.5 transition-transform duration-500 ${
                    isMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                ></span>
                <span
                  className={`block w-6 h-0.5 bg-black mb-1.5 transition-opacity duration-500 ${
                    isMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                ></span>
                <span
                  className={`block w-6 h-0.5 bg-black transition-transform duration-500 ${
                    isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                ></span>
              </button>
            </div>
          </motion.div>

          {/* Mobile Menu (animated with Framer Motion) */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={menuVariants}
                className="md:hidden overflow-hidden"
              >
                <div className="py-4">
                  <Menu orientation="vertical" onClicked={toggleMenu} />
                  {/* Button below menu when open */}
                  <motion.div
                    className="mt-4 flex justify-center"
                    variants={belowButtonVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                  >
                    <Button
                      className="rounded-xl w-full mt-5"
                      onClick={() => {
                        toggleMenu();
                        router.push("/program")
                      }}
                    >
                      Enroll now
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
