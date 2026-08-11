import type { Metadata } from "next";
import Coaches from "@/components/template/Coaches/Coaches";

export const metadata: Metadata = {
  title: "Our Coaches | Excel Pro Soccer Academy",
  description:
    "Meet the coaching team at Excel Pro Soccer Academy, led by founder Reza Abedian, former Iran National Team and Persepolis FC player. Professional youth soccer coaching in Markham, Ontario for ages 5 to 18.",
  alternates: {
    canonical: "https://www.excelproso.com/coaches",
  },
};

const CoachesPage = () => {
  return (
    <main className="min-h-screen py-28 lg:py-24 md:py-28 sm:py-24">
      <Coaches />
    </main>
  );
};

export default CoachesPage;
