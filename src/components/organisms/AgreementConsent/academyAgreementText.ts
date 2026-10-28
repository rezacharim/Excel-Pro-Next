// Excel Pro — Academy Player & Parent Agreement
//
// Used for the academy's own programs: indoor season, membership (/register)
// and trial / free sessions. The Winter League has its own agreement in
// agreementText.ts.
//
// IMPORTANT: bump ACADEMY_AGREEMENT_VERSION whenever the wording changes. The
// version is stored with every registration so the academy can always show
// which exact text a family accepted. Never edit the text without bumping it.
//
// Written for Ontario. Two things are deliberate:
//  - The release covers the PARENT's own claims only. Under Ontario law a
//    parent cannot waive a child's right to sue, so the agreement says so
//    rather than pretending otherwise (that wording is unenforceable and makes
//    the rest of the document look careless).
//  - Rowan's Law requires a yearly concussion-awareness confirmation for every
//    registered player under 26.
//
// Policy decisions confirmed by Reza (2026-10-28):
//  - Fees are not refunded in money. A credit may be offered instead.
//  - Photo / video consent is a condition of registration.

import type { Section } from "./agreementText";

export const ACADEMY_AGREEMENT_VERSION = "academy-1.0";

export const ACADEMY_AGREEMENT_TITLE = "Player & Parent Agreement";

export const ACADEMY_AGREEMENT_INTRO =
  "This agreement applies to every Excel Pro Soccer Academy program — the indoor season, regular training memberships and trial or free sessions. By registering, the parent or guardian accepts it on behalf of the family.";

/** The short version, shown above the confirmation tick. */
export const ACADEMY_ACKNOWLEDGEMENTS: string[] = [
  "Fees are not refunded in money. In some cases the academy may offer a credit toward future sessions instead.",
  "Missed or cancelled sessions are not refunded; the academy reschedules when it can.",
  "Soccer carries a real risk of injury, and I accept that risk for my child's participation.",
  "Excel Pro may photograph and film my child in training, matches and events, and use the images on its website and social media.",
  "I have shared my child's medical information and allow emergency treatment if I cannot be reached.",
  "We will follow the academy's code of conduct, on and off the field.",
];

export const ACADEMY_AGREEMENT_SECTIONS: Section[] = [
  {
    heading: "1. Programs and placement",
    paras: [
      "Players train in age groups set by the academy. Coaching staff decide the group, squad and level each player trains in, and may move a player between groups for development or safety reasons.",
      "Training times, venues and coaches may change during a season. Changes are announced on the website, by email or through the parent account.",
    ],
  },
  {
    heading: "2. Fees and payment",
    paras: [
      "Fees, deposits and due dates are those shown on the registration page at the time of registering. Payment is by Interac e-Transfer to Excelpro.Etransfer@gmail.com, with the player's full name and age group in the message.",
      "A spot is confirmed only once payment is received. Payment must be complete before the player's first session. The academy may pause or end a registration for non-payment.",
      "The uniform is paid once, at a player's first registration, and is the family's to keep.",
    ],
  },
  {
    heading: "3. Refunds and credits",
    paras: [
      "Excel Pro does not refund fees in money. This includes membership fees, season reservations and deposits, and the uniform fee. The academy books facilities, coaching staff and equipment on the basis of confirmed registrations, and those costs are committed in advance.",
      "In some situations — for example a documented injury or illness that keeps a player out for an extended period — the academy may, at its discretion, offer a credit toward future sessions instead. The academy decides whether a credit is offered, its amount, and when it can be used.",
    ],
    bullets: [
      "A credit has no cash value and cannot be exchanged for money",
      "A credit belongs to the player's family and cannot be transferred to another family",
      "Requests for a credit must be made in writing to excelprosocceracademy@gmail.com",
    ],
    note: "No refund or credit is given for sessions a player chooses to miss, for a player leaving part-way through a season or membership period, or for a suspension or removal under this agreement.",
  },
  {
    heading: "4. Cancelled sessions",
    paras: [
      "Sessions may be cancelled for weather, facility closures or other reasons outside the academy's control. Families are told as early as possible, and the academy reschedules where a facility is available. Individual cancelled sessions are not refunded.",
    ],
  },
  {
    heading: "5. Acknowledgement of risk",
    paras: [
      "Soccer is a physical contact sport. Taking part carries an inherent risk of injury, including sprains, strains, fractures, dental and facial injury, concussion and other head injury, and in rare cases serious injury. These risks come from contact with other players, the ball, equipment, goalposts, the playing surface and conditions, and cannot be removed entirely by coaching, supervision or protective equipment.",
      "I confirm the player is in good health and fit to take part. I understand the academy trains at facilities it does not own, and that the condition of those facilities is the responsibility of their operators.",
      "In consideration of the player being accepted into the program, I release Excel Pro Soccer Academy, its coaches, staff and volunteers from any claim I personally may bring arising from the player's participation, other than claims arising from gross negligence or wilful misconduct, and to the extent permitted by Ontario law. I agree to indemnify the academy against claims arising from the player's own conduct, from damage the player causes to property, or from my failure to disclose relevant medical information.",
    ],
    note: "Nothing in this agreement removes or limits any right the player themselves may have. Under Ontario law a parent cannot waive a minor's right to bring a claim, and Excel Pro does not ask any family to attempt to do so.",
  },
  {
    heading: "6. Concussion safety — Rowan's Law",
    paras: [
      "Under Rowan's Law (Concussion Safety), 2018, the parent or guardian of a player under 18 must confirm every year that they have reviewed Ontario's Concussion Awareness Resources and the academy's Concussion Code of Conduct. Players agree to:",
    ],
    bullets: [
      "Wear the right equipment, including shin guards, and keep it on properly",
      "Play by the rules and respect the coaches' and officials' decisions",
      "Avoid contact to the head and dangerous play",
      "Tell a coach or parent straight away if they think they or a teammate may have a concussion",
      "Never hide symptoms, and never pressure a teammate to keep playing",
    ],
    note: "A player suspected of having a concussion is removed from the session immediately and does not return that day. Before returning to any Excel Pro activity the player must be assessed by a physician or nurse practitioner and provide medical clearance.",
  },
  {
    heading: "7. Medical information and emergency care",
    paras: [
      "Parents must tell the academy at registration about any medical condition, allergy, medication or injury that affects participation, and keep that information up to date.",
      "If a player is hurt and a parent cannot be reached, the parent authorises Excel Pro staff to obtain emergency medical treatment for the player, including calling emergency services and transport to hospital. Families remain responsible for their own provincial health coverage and any additional insurance.",
    ],
  },
  {
    heading: "8. Photos and video",
    paras: [
      "Excel Pro photographs and films training sessions, matches and events. By registering, the parent or guardian gives the academy permission to use photos and video of the player on excelproso.com, on the academy's social media (including Instagram) and in academy promotional material, without payment.",
      "The academy does not publish a player's contact details, and does not publish a minor's full name alongside disciplinary information. A family who would like a particular photo or video taken down can write to excelprosocceracademy@gmail.com and the academy will remove it from its own website and accounts.",
      "Other parents and spectators may also take photos at sessions and matches. The academy cannot control images it does not take or publish.",
    ],
  },
  {
    heading: "9. Conduct and safe sport",
    paras: [
      "Players, parents and spectators agree to treat coaches, players, referees and other families with respect, at sessions, at matches and online. Excel Pro does not tolerate harassment, bullying, discrimination or abuse of any kind. Concerns can be raised with the Head Coach or the academy at 647-703-7821 and are handled confidentially.",
      "Families agree not to post photos or video of other people's children without their parents' consent, and to raise concerns with the academy directly rather than on social media.",
    ],
  },
  {
    heading: "10. Supervision, drop-off and pick-up",
    paras: [
      "Coaching staff supervise players during scheduled sessions only. Parents are responsible for their child before and after the session and must collect players on time. Transport to and from sessions is the family's responsibility.",
    ],
  },
  {
    heading: "11. Privacy",
    paras: [
      "Information collected at registration is used to run the academy's programs, contact families and, where a player joins a league team, register them with the league and Ontario Soccer. It is not sold or shared with third parties except as needed for those registrations.",
      "Emails about a family's own registration — confirmations, receipts, payment reminders and session details — are part of the service. News, offers and invitations are sent only to families who agree to receive them (the separate, optional box on the registration form) or as otherwise permitted by Canada's anti-spam law, and every one of those emails has a one-click unsubscribe link.",
    ],
  },
  {
    heading: "12. Suspension and removal",
    paras: [
      "The academy may suspend or remove a player or family from a program for repeated breaches of this agreement, abusive conduct toward staff, players, officials or other families, or non-payment of fees. No refund or credit is given in that case.",
    ],
  },
];
