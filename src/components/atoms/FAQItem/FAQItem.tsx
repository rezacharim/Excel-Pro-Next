"use client";
import { NextPage } from 'next';
import { motion, AnimatePresence } from 'framer-motion';

type FAQItemProps = {
  question: string;
  answer: string;
  isOpen: boolean;
  toggleOpen: () => void;
};

const FAQItem: NextPage<FAQItemProps> = ({ question, answer, isOpen, toggleOpen }) => {
  return (
    <div className="border-b border-gray-200 py-6">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={toggleOpen}
      >
        <h3 className="text-lg font-medium text-gray-900">{question}</h3>
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full focus:outline-none"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <span className="text-2xl">−</span>
          ) : (
            <span className="text-2xl">+</span>
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-2 text-base text-gray-700">
              <p>{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FAQItem;