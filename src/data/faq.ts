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
      "We welcome players from ages 5 to 18. Our programs are tailored to suit each age group's skills and development needs.",
  },
  {
    id: 2,
    question: "Do I need prior football experience to join the academy?",
    answer:
      "No prior experience is necessary. We welcome players of all skill levels, from beginners to advanced, and our coaches will help develop your skills accordingly.",
  },
  {
    id: 3,
    question: "How can I register for a training program or tournament?",
    answer:
      "You can register through our online portal on the website, visit our facility during office hours, or contact our registration team via phone or email.",
  },
  {
    id: 4,
    question: "Are the coaches certified and experienced?",
    answer:
      "Yes, all our coaches hold relevant certifications from recognized football associations and have extensive experience in coaching youth football at various levels.",
  },
  {
    id: 5,
    question: "What equipment do I need to bring for training sessions?",
    answer:
      "Players should bring football boots, shin guards, water bottle, and comfortable training attire. Training bibs and balls are provided by the academy.",
  },
];
