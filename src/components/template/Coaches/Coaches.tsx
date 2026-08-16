"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Coach {
  id: number;
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
  isPlaceholder?: boolean;
}

/** Shape returned by GET /coaches. */
interface ApiCoach {
  id: number;
  name: string;
  role: string;
  bio: string | null;
  imageUrl: string | null;
}

/**
 * The coaches as they were last shipped in code.
 *
 * These are managed from Dashboard > Coaches now, but this list stays as the
 * fallback: if the backend is asleep, mid-deploy or unreachable, the page
 * shows the real team rather than an empty grid. A visitor should never see
 * "no coaches" because of an API hiccup.
 */
const FALLBACK_COACHES: Coach[] = [
  {
    id: 1,
    name: "Reza Abedian",
    role: "Founder & Head Coach",
    bio: "Former Iran National Team player and Persepolis FC star with 18+ years of coaching experience. Reza founded Excel Pro Soccer Academy to bring professional, top-level training to young players across Markham and the GTA.",
    imageSrc: "/images/person/reza-abedian.webp",
  },
  {
    id: 2,
    name: "Reza Charim",
    role: "Head Coach & Teams Manager",
    bio: "Coach Reza has a strong background in football and sports. He played for several clubs in Kuwait until the age of 19, when an injury ended his playing career. He later worked with sports federations and the Olympic movement in Kuwait, gaining international experience through AFC, FIFA and Olympic events. Today he brings that experience and passion for the game into coaching and player development.",
    imageSrc: "/images/person/reza-charim-coach.jpg",
  },
  {
    id: 3,
    name: "Iman Badamaki",
    role: "Youth Coach",
    bio: "Coach Iman is an experienced youth football coach with over 17 years in the game. He holds an AFC B Coaching Licence and graduated top of his AFC D Licence class, earning a recommendation to advance to the next level. He has coached at the highest levels of youth football, including Premier League competition, and has won multiple championships in Mashhad and Razavi Khorasan Province. A former youth player with Aboumoslem Khorasan FC, he led Excel Pro's U10 team to a championship.",
    imageSrc: "/images/person/iman-badamaki.jpg",
  },
];

/** Grid columns that leave no orphan gap for the number of coaches we have. */
const columnsFor = (count: number): string => {
  if (count <= 1) return "grid-cols-1 max-w-sm mx-auto";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto";
  if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
};

const Coaches = () => {
  const [coaches, setCoaches] = useState<Coach[]>(FALLBACK_COACHES);

  useEffect(() => {
    if (!API_URL) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${API_URL}/coaches`);
        if (!response.ok) return;
        const data: ApiCoach[] = await response.json();
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setCoaches(
          data.map((c) => ({
            id: c.id,
            name: c.name,
            role: c.role,
            bio: c.bio ?? "",
            imageSrc: c.imageUrl || "/images/person/avatars/Avatar1.png",
          }))
        );
      } catch {
        // Keep the fallback list. An unreachable API is not a reason to show
        // the visitor an empty page.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        <div className={`grid gap-6 ${columnsFor(coaches.length)}`}>
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
                {coach.imageSrc.startsWith("/") ? (
                  <Image
                    src={coach.imageSrc}
                    alt={`${coach.name} - ${coach.role}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover object-top"
                  />
                ) : (
                  /* Photos uploaded through the dashboard live on whatever host
                     the Gallery uses. next/image would throw at runtime on an
                     unconfigured domain and take the whole page down, so a
                     plain img is the safer choice for those. */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coach.imageSrc}
                    alt={`${coach.name} - ${coach.role}`}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                )}
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
