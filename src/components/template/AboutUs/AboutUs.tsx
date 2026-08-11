import { fetchAllImages } from "@/services/getAllImages";
import AboutSection from "@/components/organisms/AboutSection/AboutSection";


export const revalidate = 30;

const TeamGallery = async () => {

  const teamImages = await fetchAllImages();

  return (
    <section className="bg-white overflow-hidden">
          <AboutSection teamImages={teamImages} />
    </section>
  );
};

export default TeamGallery;
