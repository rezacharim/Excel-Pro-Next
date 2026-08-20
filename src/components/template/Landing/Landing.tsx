import BannerSlider from "@/components/organisms/Billboard/Billboard";
import LatestNews from "@/components/organisms/LatestNews/LatestNews";
import HeroSection from "@/components/organisms/HeroSection/HeroSection";
import Summary from "@/components/organisms/Summery/Summery";
import SummeryPrograms from "@/components/organisms/SummeryPrograms/SummeryPrograms";
import SummeryServices from "@/components/organisms/SummeryServices/SummeryServices";
import WhyCooseUs from "./../../organisms/WhyCooseUs/WhyCooseUs";
import Testimonial from "@/components/organisms/Testimonial/Testimonial";
import ContactForm from "@/components/organisms/ContactForm/ContactForm";
import InstagramFeed from "@/components/organisms/InstagramFeed/InstagramFeed";
import { PlayerProvider } from "@/context/PlayerContext/PlayerContext";
import { fetchAllPlayerMonth } from "@/services/getPlayerMonth";
import NextGameCard from "@/components/organisms/NextGame/NextGameCard";
import {
  getRecentFixtures,
  getTeams,
  getUpcomingFixtures,
} from "@/services/fixtures";
import { getSiteText } from "@/services/siteText";

export const revalidate = 30;

const Landing = async () => {
  
  // Fetched together so a slow fixture list does not hold up the player of
  // the month, and vice versa.
  const [players, fixtures, results, teams, siteText] = await Promise.all([
    fetchAllPlayerMonth(),
    getUpcomingFixtures(12),
    getRecentFixtures(4),
    getTeams(),
    getSiteText(),
  ]);

  return (
    <div className="py-40">
      <PlayerProvider players={players}>
        <section className="mx-4">
          <BannerSlider />
        </section>
      </PlayerProvider>
      {/* Directly under the banner: news on the left, the next game for each
          team on the right. The fixtures card used to be a full-width band of
          its own below this; folding it into the same row saved roughly 600px
          of home page without dropping anything from it. It renders nothing at
          all when there are no fixtures, so an out-of-season home page does
          not carry an empty box. */}
      <LatestNews
        aside={
          <NextGameCard
            fixtures={fixtures}
            results={results}
            teams={teams}
            text={siteText}
          />
        }
      />
      <HeroSection />
      <Summary />
      <SummeryServices />
      <SummeryPrograms />
      <section className="mx-4">
        <WhyCooseUs />
      </section>
        <Testimonial />
      <InstagramFeed />
      <section>
        <ContactForm />
      </section>
    </div>
  );
};

export default Landing;
