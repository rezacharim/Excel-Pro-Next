// Both agreements in one table. Kept out of AgreementConsent.tsx (a client
// component) so server-rendered pages such as /policies can read the text.

import {
  ACKNOWLEDGEMENTS,
  AGREEMENT_INTRO,
  AGREEMENT_SECTIONS,
  AGREEMENT_TITLE,
  AGREEMENT_VERSION,
  type Section,
} from "./agreementText";
import {
  ACADEMY_ACKNOWLEDGEMENTS,
  ACADEMY_AGREEMENT_INTRO,
  ACADEMY_AGREEMENT_SECTIONS,
  ACADEMY_AGREEMENT_TITLE,
  ACADEMY_AGREEMENT_VERSION,
} from "./academyAgreementText";

/**
 * Which agreement to show.
 *   league  — Winter League (competitive team) agreement. Photo consent is a
 *             separate yes/no choice.
 *   academy — indoor season, membership and trials. Photo consent is part of
 *             the agreement (a condition of registration, Reza 2026-10-28).
 */
export type AgreementVariant = "league" | "academy";

interface AgreementTexts {
  version: string;
  title: string;
  intro: string;
  sections: Section[];
  acknowledgements: string[];
  /** Where the Concussion Code of Conduct sits, for the Rowan's Law tick. */
  concussionSection: string;
  photoRequired: boolean;
}

export const AGREEMENT_TEXTS: Record<AgreementVariant, AgreementTexts> = {
  league: {
    version: AGREEMENT_VERSION,
    title: AGREEMENT_TITLE,
    intro: AGREEMENT_INTRO,
    sections: AGREEMENT_SECTIONS,
    acknowledgements: ACKNOWLEDGEMENTS,
    concussionSection: "section 9",
    photoRequired: false,
  },
  academy: {
    version: ACADEMY_AGREEMENT_VERSION,
    title: ACADEMY_AGREEMENT_TITLE,
    intro: ACADEMY_AGREEMENT_INTRO,
    sections: ACADEMY_AGREEMENT_SECTIONS,
    acknowledgements: ACADEMY_ACKNOWLEDGEMENTS,
    concussionSection: "section 6",
    photoRequired: true,
  },
};

/** Public page with the full text of both agreements. */
export const POLICIES_PATH = "/policies";
