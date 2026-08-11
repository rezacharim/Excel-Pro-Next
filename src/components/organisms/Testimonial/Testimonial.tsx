"use client";
import { useState, useRef } from 'react';
import { NextPage } from 'next';
import Image from 'next/image';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import IndicatorDot from '../../atoms/IndicatorDot/IndicatorDot';
import ArrowButton from '@/components/atoms/ArrowButton/ArrowButton';

// data
import { testimonials } from './data';

const Testimonial: NextPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const currentTestimonial = testimonials[currentIndex];

  // انیمیشن برای عنوان
  const titleVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.8, 
        ease: "easeOut" 
      }
    }
  };

  // انیمیشن برای کل کانتینر
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.9, 
        ease: "easeOut",
        staggerChildren: 0.2
      }
    }
  };

  // انیمیشن برای محتوای تستیمونیال
  const contentVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.7, 
        ease: "easeOut"
      }
    }
  };

  // انیمیشن برای تصویر
  const imageVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.9, 
        ease: "easeOut"
      }
    }
  };


  // کنترل جهت انیمیشن اسلاید
  const [[page, direction], setPage] = useState([0, 0]);

  const updateSlide = (newDirection: number) => {
    if (newDirection > 0) {
      handleNext();
    } else {
      handlePrevious();
    }
    setPage([page + newDirection, newDirection]);
  };

  return (
    <motion.section 
      ref={sectionRef}
      className="w-full py-12 px-4 md:px-8 bg-white"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-[#121212] mb-10"
          variants={titleVariants}
        >
          Testimonial
        </motion.h2>
        
        {/* Mobile layout (stacked) */}
        <motion.div 
          className="block md:hidden rounded-2xl overflow-hidden shadow-lg"
          variants={containerVariants}
        >
          {/* Image section on top for mobile */}
          <AnimatePresence initial={false} custom={direction}>
            <motion.div 
              key={currentIndex}
              className="w-full h-48 relative"
              variants={imageVariants}
              custom={direction}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <Image
                src={currentTestimonial.image_index}
                alt="Academy testimonial"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center object-top" 
                priority
              />
            </motion.div>
          </AnimatePresence>
          
          {/* Testimonial content below for mobile */}
          <motion.div 
            className="w-full bg-white p-6 flex flex-col z-10 relative min-h-[250px]"
            variants={contentVariants}
          >
            {/* Quotation marks background */}
            <motion.div 
              className="absolute top-6 left-6 opacity-40 scale-75 pointer-events-none"
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: 0.4, rotate: 0 }}
              transition={{ duration: 1.2, delay: 0.3 }}
            >
              <svg width="219" height="172" viewBox="0 0 219 172" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path opacity="0.3" d="M14.6468 81.3625V81.3654C14.6468 86.6835 18.8957 90.9324 24.2138 90.9324H80.4335V166.25H5.11594V81.3654C5.11594 42.4979 34.326 10.3116 71.8874 5.59208V15.1819C56.8496 17.3803 42.9536 24.6443 32.5443 35.8468C21.0497 48.2174 14.6566 64.4759 14.6468 81.3625ZM213.876 90.9324V166.25H138.559V81.3654C138.559 42.4969 167.772 10.3052 205.419 5.59062V15.1726C173.004 19.8435 148.09 47.7017 148.09 81.3654C148.09 86.6835 152.339 90.9324 157.657 90.9324H213.876Z" stroke="#FC0D1C" strokeWidth="10.2319"/>
                </g>
              </svg>
            </motion.div>
            
            {/* Main content area */}
            <AnimatePresence initial={false} mode="wait">
              <motion.div 
                key={currentIndex}
                className="relative z-10 flex-1 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="overflow-auto max-h-[120px]">
                  <p className="text-base text-gray-700">{currentTestimonial.text}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* User info area */}
            <AnimatePresence initial={false} mode="wait">
              <motion.div 
                key={currentIndex}
                className="flex items-center mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image 
                    src={currentTestimonial.avatar}
                    alt={currentTestimonial.name}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </motion.div>
                <div>
                  <p className="font-bold text-base text-[#121212]">{currentTestimonial.name}</p>
                  <p className="text-xs text-gray-500">{currentTestimonial.location}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Navigation controls */}
            <motion.div 
              className="flex justify-between items-center"
              variants={contentVariants}
            >
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <IndicatorDot 
                    key={index}
                    bgActiveColor="bg-black"
                    isActive={index === currentIndex}
                    onClick={() => setCurrentIndex(index)}
                  />
                ))}
              </div>
              
              <div className="flex space-x-3">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <ArrowButton 
                    direction="left"
                    onClick={() => updateSlide(-1)}
                    variant="gray"
                  />
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <ArrowButton
                    direction="right"
                    onClick={() => updateSlide(1)}
                    variant="primary"
                  />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Desktop layout (side-by-side) */}
        <motion.div 
          className="hidden md:flex rounded-2xl overflow-hidden shadow-lg"
          variants={containerVariants}
        >
          {/* Left side - Testimonial content section */}
          <motion.div 
            className="w-3/5 bg-white p-8 lg:p-12 flex flex-col justify-between z-10 relative"
            variants={contentVariants}
          >
            {/* Quotation marks background (light red/pink) */}
            <motion.div 
              className="absolute top-12 left-12 opacity-40 pointer-events-none"
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: 0.4, rotate: 0 }}
              transition={{ duration: 1.2, delay: 0.5 }}
            >
              <svg width="219" height="172" viewBox="0 0 219 172" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path opacity="0.3" d="M14.6468 81.3625V81.3654C14.6468 86.6835 18.8957 90.9324 24.2138 90.9324H80.4335V166.25H5.11594V81.3654C5.11594 42.4979 34.326 10.3116 71.8874 5.59208V15.1819C56.8496 17.3803 42.9536 24.6443 32.5443 35.8468C21.0497 48.2174 14.6566 64.4759 14.6468 81.3625ZM213.876 90.9324V166.25H138.559V81.3654C138.559 42.4969 167.772 10.3052 205.419 5.59062V15.1726C173.004 19.8435 148.09 47.7017 148.09 81.3654C148.09 86.6835 152.339 90.9324 157.657 90.9324H213.876Z" stroke="#FC0D1C" strokeWidth="10.2319"/>
                </g>
              </svg>
            </motion.div>
            
            {/* Main content with fixed height */}
            <div className="min-h-[300px] flex flex-col">
              {/* Testimonial text */}
              <AnimatePresence initial={false} mode="wait">
                <motion.div 
                  key={currentIndex}
                  className="relative z-10 mb-8 flex-grow overflow-auto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-lg text-gray-700">{currentTestimonial.text}</p>
                </motion.div>
              </AnimatePresence>
              
              {/* User information */}
              <AnimatePresence initial={false} mode="wait">
                <motion.div 
                  key={currentIndex}
                  className="flex items-center mb-8"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div 
                    className="w-12 h-12 rounded-full overflow-hidden mr-4 flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image 
                      src={currentTestimonial.avatar}
                      alt={currentTestimonial.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </motion.div>
                  <div>
                    <p className="font-bold text-lg text-[#121212]">{currentTestimonial.name}</p>
                    <p className="text-sm text-gray-500">{currentTestimonial.location}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
              
              {/* Navigation controls */}
              <motion.div 
                className="flex justify-between items-center"
                variants={contentVariants}
              >
                <div className="flex space-x-2">
                  {testimonials.map((_, index) => (
                    <IndicatorDot 
                      key={index}
                      bgActiveColor="bg-black"
                      isActive={index === currentIndex}
                      onClick={() => setCurrentIndex(index)}
                    />
                  ))}
                </div>
                
                <div className="flex space-x-4">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <ArrowButton 
                      direction="left"
                      onClick={() => updateSlide(-1)}
                      variant="gray"
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <ArrowButton
                      direction="right"
                      onClick={() => updateSlide(1)}
                      variant="primary"
                    />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Right side - Image section */}
          <AnimatePresence initial={false} custom={direction}>
            <motion.div 
              key={currentIndex}
              className="w-2/5 relative"
              variants={imageVariants}
              custom={direction}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <Image
                src={currentTestimonial.image_index}
                alt="Academy testimonial"
                fill
                sizes="(max-width: 1024px) 40vw, 30vw"
                className="object-cover object-top"
                priority
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Testimonial;