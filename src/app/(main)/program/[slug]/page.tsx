import { NextPage } from "next";
import { notFound, redirect } from "next/navigation";
import { programs } from "@/components/organisms/SummeryPrograms/data";
import ProgramDetails from "@/components/template/Program/ProgramDetails/ProgramDetails";

interface ProgramPageProps {
  params: { slug: string };
}

const ProgramPage: NextPage<ProgramPageProps> = ({ params }) => {
  const decodedSlug = decodeURIComponent(params.slug).replace(/–/g, "-");

  const normalize = (str: string): string =>
    str
      .toLowerCase()
      .replace(/\s*–\s*/g, '-')
      .replace(/\s*-\s*/g, '-')
      .replace(/\s+/g, '');


  const validFormat = /^u\d+-u\d+$/i.test(decodedSlug);
  if (!validFormat) {
    return notFound();
  }

  const slugMatches = decodedSlug.match(/^u(\d+)-u(\d+)$/i);
  if (!slugMatches) {
    return notFound();
  }

  const requestedStartAge = parseInt(slugMatches[1]);
  const requestedEndAge = parseInt(slugMatches[2]);
  

  const program = programs.find(p => {

    if (normalize(p.ageGroup) === normalize(decodedSlug)) {
      return true;
    }
    

    const groupMatches = p.ageGroup.match(/u(\d+)\s*[–-]\s*u(\d+)/i);
    if (groupMatches) {
      const groupStartAge = parseInt(groupMatches[1]);
      const groupEndAge = parseInt(groupMatches[2]);
      
      return requestedStartAge >= groupStartAge && requestedEndAge <= groupEndAge;
    }
    
    return false;
  });

  if (!program) {
    return redirect('/program');
  }

  return (
    <main className="min-h-screen bg-gray-50 py-36 lg:py-28 md:py-28 sm:py-36">
        <ProgramDetails 
          program={program}
          decodedSlug={decodedSlug}
        />
    </main>
  );
};

export default ProgramPage;