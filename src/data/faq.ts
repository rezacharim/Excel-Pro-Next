/**
 * FAQ content shown on the Contact Us page.
 *
 * Kept in a plain data module (no "use client") so the same questions and
 * answers can be rendered in the FAQ accordion AND emitted as FAQPage
 * JSON-LD structured data from the server component page.
 */

export type FAQEntry = {
  id: number;
  question: string;
  answer: string;
};

export const contactFaqData: FAQEntry[] = [
  {
    id: 1,
    question: "What age groups do you accept at Excel Pro Academy?",
    answer:
      "We welcome players from ages 6 to 18, in four groups: U6–U9, U10–U12, U13–U14 and U15–U18. Our programs are tailored to suit each age group's skills and development needs.",
  },
  {
    id: 2,
    question: "Does my child need soccer experience to join?",
    answer:
      "No prior experience is necessary. We welcome players of all skill levels, from beginners to advanced, and our coaches will help develop your skills accordingly.",
  },
  {
    id: 3,
    question: "How do I register my child?",
    answer:
      "Register online — the Enroll now button on any page takes you to this season's form, and it takes about three minutes. New players are welcome during the season while spaces last. You can also call +1 647-703-7821 or email excelprosocceracademy@gmail.com and we will register your child for you.",
  },
  {
    id: 4,
    question: "Are the coaches certified and experienced?",
    answer:
      "Yes, all our coaches hold relevant certifications from recognized soccer associations and have extensive experience coaching youth soccer at various levels.",
  },
  {
    id: 5,
    question: "What equipment do I need to bring for training sessions?",
    answer:
      "Players should bring soccer cleats, shin guards, water bottle, and comfortable training attire. Training bibs and balls are provided by the academy.",
  },
];
