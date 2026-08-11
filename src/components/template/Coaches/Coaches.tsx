"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface Coach {
  id: number;
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
  isPlaceholder?: boolean;
}

// TODO (Reza): ~6 coach profiles plus a photo gallery of Reza's playing career
// (Iran National Team / Persepolis FC) are coming as a separate page once the
// photos arrive.
const coaches: Coach[] = [
  {
    id: 1,
    name: "Reza Abedian",
    role: "Founder & Head Coach",
    bio: "Former Iran National Team player and Persepolis FC star with 18+ years of coaching experience. Reza founded Excel Pro Soccer Academy to bring professional, top-level training to young players across Markham and the GTA.",
    imageSrc: "/images/person/reza-abedian.webp",
  },
  // TODO (Reza): replace the three placeholder coaches below with real names,
  // roles, short bios and photos (drop photos into /public/images/person/).
  {
    id: 2,
    name: "Coach Name",
    role: "Assistant Coach",
    bio: "Bio coming soon. A certified youth coach focused on technical development and building confidence in every player.",
    imageSrc: "/images/person/avatars/Avatar1.png",
    isPlaceholder: true,
  },
  {
    id: 3,
    name: "Coach Name",
    role: "Youth Development Coach",
    bio: "Bio coming soon. Specializes in our youngest age groups, making every session fun, energetic and skill-focused.",
    imageSrc: "/images/person/avatars/Avatar2.png",
    isPlaceholder: true,
  },
  {
    id: 4,
    name: "Coach Name",
    role: "Goalkeeping & Fitness Coach",
    bio: "Bio coming soon. Leads goalkeeper sessions and strength & conditioning for our competitive and high-performance teams.",
    imageSrc: "/images/person/avatars/Avatar3.png",
    isPlaceholder: true,
  },
];

const Coaches = () => {
  return (
    <section className="bg-white overflow-hidden">
      {/* Hero */}
      <motion.div
        className="bg-[#FFF3F2] bg-[url('/images/other/tech-bg.png')] bg-cover bg-center px-4 sm:px-6 lg:px-8 pt-8 pb-20"
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
            <span className="text-red-500 font-medium">Coaches</span>
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
              Our Team
            </motion.span>
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              Meet Our Coaches
            </motion.h1>
            <motion.p
              className="mt-4 text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              Our team of 12 professional coaches develops players ages 5 to 18
              with passion, experience and a proven training philosophy.
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Coach cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coaches.map((coach, index) => (
            <motion.article
              key={coach.id}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
            >
              <div className="relative w-full h-64 bg-gray-100">
                <Image
                  src={coach.imageSrc}
                  alt={`${coach.name} - ${coach.role}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover object-top"
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h2 className="text-lg font-bold text-gray-900">
                  {coach.name}
                </h2>
                <p className="text-sm font-medium text-primary mt-1">
                  {coach.role}
                </p>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  {coach.bio}
                </p>
              </div>
            </motion.article>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="mt-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-gray-900">
            Train with us at Ashton Meadows Park
          </h2>
          <p className="mt-2 text-gray-600">
            Practices run Monday and Wednesday evenings in Markham, Ontario.
          </p>
          <Link
            href="/program"
            className="inline-block mt-6 px-8 py-3 bg-primary hover:bg-[#c9281e] text-white rounded-md font-medium transition-colors"
          >
            View our programs
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Coaches;
