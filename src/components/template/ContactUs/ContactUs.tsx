"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import FAQItem from "@/components/atoms/FAQItem/FAQItem";
import FAQSection from "@/components/organisms/FAQSection/FAQSection";
import ContactInfoSection from "@/components/organisms/ContactInfoSection/ContactInfoSection";
import { contactFaqData } from "@/data/faq";

// Dynamically load the map component with SSR disabled
// This is crucial to prevent the "window is not defined" error
const DynamicLeafletMap = dynamic(
  () => import("@/components/atoms/LeafletMap/LeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-gray-100 flex items-center justify-center rounded-xl">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  }
);

type FAQItem = {
  id: number;
  question: string;
  answer: string;
};

const ContactUs = () => {
  // Ashton Meadows Park, Markham, Ontario
  // TODO (Reza): confirm exact coordinates of the training field
  const position: [number, number] = [43.8887, -79.3537];

  const faqData: FAQItem[] = contactFaqData;

  return (
    <section className="bg-white overflow-hidden">
      <motion.div
        className="bg-[#FFF3F2] bg-[url('/images/other/tech-bg.png')] bg-cover bg-center px-4 sm:px-6 lg:px-8 pt-8 pb-14"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="flex items-center text-sm text-gray-500 my-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-red-500 font-medium">Contact Us</span>
          </motion.div>

          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            <motion.span
              className="inline-block px-3 py-1 bg-red-100 text-red-500 text-sm font-medium rounded-xl mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Contact
            </motion.span>
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              Stay in touch with us
            </motion.h1>
          </motion.div>
        </div>

        {/* Contact Information Cards */}
       <ContactInfoSection />
      </motion.div>

      {/* Leaflet Map Section - The map will be displayed here */}
      <motion.div
        className="max-w-7xl mx-auto rounded-xl overflow-hidden shadow-lg mt-[-60px]"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <div className="h-[400px] w-full rounded-xl overflow-hidden">
          {/* Use the dynamic component that disables SSR */}
          <DynamicLeafletMap
            position={position}
            popupText="Ashton Meadows Park - Excel Pro Soccer Academy"
          />
        </div>
      </motion.div>

      {/* Locations Section */}
      <motion.section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        aria-labelledby="locations-heading"
      >
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-red-100 text-red-500 text-sm font-medium rounded-xl mb-4">
            Locations
          </span>
          <h2
            id="locations-heading"
            className="text-2xl sm:text-3xl font-bold text-gray-900"
          >
            Where We Train
          </h2>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-xl shadow-sm p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-bold text-gray-900 mb-2">
              Ashton Meadows Park
            </h3>
            {/* TODO (Reza): confirm exact street address / postal code */}
            <p className="text-gray-600 text-sm">
              3rd Line, Markham, Ontario
            </p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Practice Nights</h3>
            <p className="text-gray-600 text-sm">
              Monday &amp; Wednesday evenings
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Ages 5-12: 5:00 PM - 6:30 PM
              <br />
              Ages 13-18: 6:30 PM - 8:00 PM
            </p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Game Days</h3>
            <p className="text-gray-600 text-sm">
              Game schedule is posted on the Matchday page each season.
            </p>
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <FAQSection data={faqData} />

    </section>
  );
};

export default ContactUs;
