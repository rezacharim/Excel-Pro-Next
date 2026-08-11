import PlayerInformationForm from "@/components/molecules/RegisterForms/PlayerInformationForm";
import ContactForm from "@/components/molecules/RegisterForms/ContactForm";
import SoccerBackground from "@/components/molecules/RegisterForms/SoccerBackground";
import Acknowledgment from "@/components/molecules/RegisterForms/Acknowledgment";
import PhotoUploadForm from "@/components/molecules/RegisterForms/AdditionalInformation";

// types
import { StepType } from "./types";



export const steps: StepType[] = [
    {
      number: 1,
      title: "Step 1",
      subtitle: "Player Information",
      isLast: false,
      component: <PlayerInformationForm />,
    },
    { 
      number: 2, 
      title: "Step 2", 
      subtitle: "Contact Details", 
      isLast: false,
      component: <ContactForm />
    },
    {
      number: 3,
      title: "Step 3",
      subtitle: "Soccer Background",
      isLast: false,
      component:<SoccerBackground />
    },
    {
      number: 4,
      title: "Step 4",
      subtitle: "Additional Information",
      isLast: false,
      component: <PhotoUploadForm />
    },
    { 
      number: 5, 
      title: "Last step", 
      subtitle: "Acknowledgment", 
      isLast: true,
      component:<Acknowledgment />
    },
  ];