import PlayerInformationForm from "@/components/molecules/RegisterForms/PlayerInformationForm";
import ContactForm from "@/components/molecules/RegisterForms/ContactForm";
import Acknowledgment from "@/components/molecules/RegisterForms/Acknowledgment";

// types
import { StepType } from "./types";

export const steps: StepType[] = [
  {
    number: 1,
    title: "Step 1",
    subtitle: "Player",
    isLast: false,
    component: <PlayerInformationForm />,
  },
  {
    number: 2,
    title: "Step 2",
    subtitle: "Parent & contact",
    isLast: false,
    component: <ContactForm />,
  },
  {
    number: 3,
    title: "Last step",
    subtitle: "Soccer & consent",
    isLast: true,
    component: <Acknowledgment />,
  },
];

/**
 * Single source of truth for "how many steps does the wizard have". Anything
 * past this is the payment screen, so every step check reads this constant
 * instead of hard-coding a number.
 */
export const TOTAL_STEPS = steps.length;
