import BannerSlider from "@/components/organisms/Billboard/Billboard";
import HeroSection from "@/components/organisms/HeroSection/HeroSection";
import Summary from "@/components/organisms/Summery/Summery";
import SummeryPrograms from "@/components/organisms/SummeryPrograms/SummeryPrograms";
import SummeryServices from "@/components/organisms/SummeryServices/SummeryServices";
import WhyCooseUs from "./../../organisms/WhyCooseUs/WhyCooseUs";
import Testimonial from "@/components/organisms/Testimonial/Testimonial";
import ContactForm from "@/components/organisms/ContactForm/ContactForm";
import { PlayerProvider } from "@/context/PlayerContext/PlayerContext";
import { fetchAllPlayerMonth } from "@/services/getPlayerMonth";

export const revalidate = 30;

const Landing = async () => {
  
  const players = await fetchAllPlayerMonth();

  return (
    <div className="py-40">
      <PlayerProvider players={players}>
        <section className="mx-4">
          <BannerSlider />
        </section>
      </PlayerProvider>
      <HeroSection />
      <Summary />
      <SummeryServices />
      <SummeryPrograms />
      <section className="mx-4">
        <WhyCooseUs />
      </section>
        <Testimonial />
      <section>
        <ContactForm />
      </section>
    </div>
  );
};

export default Landing;
