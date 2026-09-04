// Excel Pro — Competitive League Player & Parent Agreement
//
// IMPORTANT: bump AGREEMENT_VERSION whenever the wording below changes.
// The version string is stored against every registration, so that you can
// always prove which exact text a family agreed to. Never edit the text
// without bumping the version.

export const AGREEMENT_VERSION = "league-1.0";

export type Section = {
  heading: string;
  paras?: string[];
  bullets?: string[];
  note?: string;
};

export const AGREEMENT_TITLE =
  "Competitive League Player & Parent Agreement";

// Shown as a visible summary card directly above the confirmations.
// These are read, not clicked — six separate tick boxes is where parents
// abandon the form on a phone. The single acceptance below covers all of them,
// and AGREEMENT_VERSION records exactly which wording was accepted.
export const ACKNOWLEDGEMENTS: string[] = [
  "Competitive league registration does not guarantee equal playing time.",
  "Playing time may vary according to performance, attendance, readiness and match circumstances.",
  "Coaching staff have final authority over substitutions, positions, formations and playing time.",
  "I will not confront or pressure coaches regarding playing time during or immediately after matches.",
  "My child's development and performance may affect their competitive match opportunities.",
  "I agree to communicate respectfully with Excel Pro coaches and staff.",
];

export const AGREEMENT_INTRO =
  "By registering a player for an Excel Pro competitive league team, the player and parent or guardian acknowledge that competitive soccer is different from recreational or house-league soccer.";

export const AGREEMENT_SECTIONS: Section[] = [
  {
    heading: "1. Playing time",
    paras: [
      "Registration on a competitive team does not guarantee equal playing time.",
      "Our coaching staff will always work to provide players with opportunities to develop and participate. However, playing time may vary depending on:",
    ],
    bullets: [
      "Player performance and match readiness",
      "Training attendance and commitment",
      "Effort, attitude and discipline",
      "Technical ability and decision-making",
      "Fitness, speed and reaction",
      "Tactical understanding and positional requirements",
      "Strength of the opponent",
      "Score and circumstances of the match",
      "Team balance and competitive requirements",
    ],
    note: "In close, difficult, playoff, tournament or important league matches, coaches may rely more heavily on players who are currently performing at the required competitive level.",
  },
  {
    heading: "2. Playing time must be earned",
    paras: [
      "Competitive match minutes are earned through training, improvement, performance and then opportunity.",
      "A player receiving fewer minutes is not being punished or excluded. It may simply mean that additional development is required before the player is ready for greater responsibility during competitive matches. The coaching staff will continue supporting that player's development.",
    ],
  },
  {
    heading: "3. Competitive level",
    paras: [
      "Excel Pro teams participate in competitive leagues where the academy has a responsibility both to develop individual players and to compete responsibly as a team.",
      "Some players develop faster than others. Coaches evaluate each player based on their current readiness rather than comparing children unfairly with one another.",
      "Families looking specifically for guaranteed or equal playing time regardless of performance may find a recreational or house-league program more appropriate for that expectation.",
    ],
  },
  {
    heading: "4. Coach's decision",
    paras: [
      "During matches, the Head Coach and coaching staff have final authority regarding:",
    ],
    bullets: [
      "Starting lineup",
      "Substitutions",
      "Playing time",
      "Player positions",
      "Formation",
      "Tactical decisions",
      "Goalkeeper selection",
      "Tournament and match selection",
    ],
    note: "Parents must not pressure coaches to substitute their child into a game or question coaching decisions from the sideline.",
  },
  {
    heading: "5. Parent communication",
    paras: [
      "We welcome respectful conversations regarding a player's development. However, complaints regarding playing time should not be made during a game, immediately after a game, or in front of players or other parents.",
      "Parents who would like feedback may contact the coaching staff privately and arrange an appropriate time to discuss areas requiring improvement, training performance, match readiness, development goals, and how the player can earn additional opportunities.",
    ],
  },
  {
    heading: "6. Attendance and commitment",
    paras: [
      "Competitive players are expected to attend practices consistently and arrive on time.",
      "Repeated missed practices, late arrivals, lack of effort or poor commitment may affect starting opportunities, playing time, match selection and tournament selection. Whenever possible, absences should be communicated to the coaching staff in advance.",
    ],
  },
  {
    heading: "7. Player behaviour",
    paras: ["Players are expected to:"],
    bullets: [
      "Respect coaches, teammates, opponents and referees",
      "Listen to coaching instructions",
      "Maintain a positive attitude",
      "Support teammates whether starting or on the bench",
      "Accept substitutions respectfully",
      "Behave appropriately before, during and after matches",
    ],
    note: "Poor behaviour or repeated disciplinary issues may result in reduced playing time or other disciplinary action.",
  },
  {
    heading: "8. Development comes first",
    paras: [
      "Our objective is not simply to place a child on the field. Our objective is to prepare the player to perform successfully when they are on the field.",
      "Excel Pro coaches will continue helping every player improve technically, physically, tactically and mentally so they can become more confident and effective competitive players.",
    ],
  },
  {
    heading: "9. Concussion safety — Rowan's Law",
    paras: [
      "Under Rowan's Law (Concussion Safety), 2018, Excel Pro cannot register a player under 18 unless the parent or guardian confirms every year that they have reviewed Ontario's Concussion Awareness Resources and this Concussion Code of Conduct.",
      "Players agree to:",
    ],
    bullets: [
      "Wear the right equipment and keep it on properly",
      "Play by the rules and respect the officials' decisions",
      "Avoid contact to the head and avoid dangerous play",
      "Tell a coach, trainer or parent immediately if they think they may have a concussion, or if they think a teammate may have one, even in an important match",
      "Never hide symptoms, and never pressure a teammate to keep playing",
    ],
    note: "A player suspected of having a concussion is removed from training or the match immediately and does not return that day. Before returning to any Excel Pro activity the player must be assessed by a physician or nurse practitioner and provide written medical clearance. Excel Pro follows the Ontario Soccer and Canada Soccer concussion policy.",
  },
  {
    heading: "10. Acknowledgement of risk",
    paras: [
      "Soccer is a physical contact sport. Participation carries an inherent risk of injury, including sprains, strains, fractures, dental and facial injury, concussion and other head injury, and in rare cases serious injury. These risks arise from contact with other players, the ball, equipment, goalposts, the playing surface and weather conditions, and cannot be eliminated by coaching, supervision or protective equipment.",
      "I confirm the player is in good health and medically fit to take part in competitive soccer. I understand Excel Pro trains and plays at facilities it does not own, and that the condition and supervision of those facilities is the responsibility of their operators.",
      "In consideration of the player being accepted for registration, I release Excel Pro Soccer Academy, its coaches, staff and volunteers from any claim I personally may bring arising from the player's participation, other than claims arising from gross negligence or wilful misconduct, and to the extent permitted by Ontario law. I agree to indemnify Excel Pro against any claim arising from the player's own conduct, from damage the player causes to property, or from my failure to disclose relevant medical information.",
    ],
    note: "Nothing in this agreement removes or limits any right the player themselves may have. Under Ontario law a parent cannot waive a minor's right to bring a claim, and Excel Pro does not ask any family to attempt to do so.",
  },
  {
    heading: "11. Insurance",
    paras: [
      "Excel Pro is affiliated with Ontario Soccer through its league registrations. Players registered through Excel Pro are covered by the insurance carried under that affiliation. Families remain responsible for their own provincial health coverage and any supplementary or dental insurance.",
    ],
  },
  {
    heading: "12. Medical information and emergency care",
    paras: [
      "Parents must disclose at registration any medical condition, allergy, medication or injury that affects participation, and must keep that information current.",
      "If a player is injured and a parent cannot be reached, parents authorise Excel Pro staff to obtain emergency medical treatment for the player, including calling emergency services and transport to hospital.",
    ],
  },
  {
    heading: "13. Fees and payment",
    paras: [
      "The competitive league fee is $900 per player, paid in two instalments of $450.",
      "This covers the full uniform, league registration, the Ontario Soccer number, referee fees, field rental and coaching staff. There is nothing further to pay during the season.",
      "Payment is by e-transfer to Excelpro.Etransfer@gmail.com. A late fee applies after the posted first-payment date.",
      "Excel Pro registers each player with the league and Ontario Soccer, books fields and assigns coaching staff on the basis of confirmed registrations, and those costs are committed before the season starts.",
    ],
    note: "Refund policy: the $900 competitive league fee is non-refundable. Excel Pro registers each player with the league and Ontario Soccer, books fields and commits coaching staff on the basis of confirmed registrations, and those costs cannot be recovered once committed. No refund is issued for missed sessions, missed matches, suspension, injury, or a player leaving the team during the season.",
  },
  {
    heading: "14. Registration, rosters and player movement",
    paras: [
      "A player registered with Excel Pro for a season is registered with Ontario Soccer through this club and may not play for another club in the same competition without a written release. Requests to transfer mid-season are handled through the league's process and cannot be guaranteed.",
      "Team placement is decided by the coaching staff. Players may be moved between age groups or squads during the season for development or team-balance reasons.",
    ],
  },
  {
    heading: "15. Uniform and equipment",
    paras: [
      "Players must wear the full Excel Pro uniform for all matches. Shin guards are mandatory for every training session and every match — no shin guards, no participation. Players are responsible for bringing water, appropriate footwear for the surface, and weather-appropriate clothing.",
      "The uniform is included in the league fee and is the family's to keep.",
    ],
  },
  {
    heading: "16. Sideline conduct and referee abuse",
    paras: [
      "Many of our referees are teenagers. Excel Pro operates a zero-tolerance policy on referee abuse, in line with Ontario Soccer. At matches and training, spectators agree to:",
    ],
    bullets: [
      "Encourage effort rather than outcome, for both teams",
      "Leave coaching to the coaches — a child receiving instructions from the sideline and the bench at the same time cannot play",
      "Never criticise, argue with or approach a referee, opposing player, opposing coach or opposing parent",
      "Never criticise a child, theirs or anyone else's, in public",
    ],
    note: "Anyone who breaches this may be asked to leave the venue. Repeated breaches may result in the family's registration being ended.",
  },
  {
    heading: "17. Social media and team communication",
    paras: [
      "Excel Pro's official channels are the website, the parent portal and the academy's Instagram. Team group chats are for logistics.",
      "Families agree not to post criticism of coaches, players, referees or other families on social media, and not to post photos or video of other people's children without their parents' consent.",
    ],
  },
  {
    heading: "18. Photography and media",
    paras: [
      "Excel Pro photographs and films training sessions, matches and events, and uses these images on excelproso.com, on Instagram and in academy promotional material. Consent is given separately below and can be withdrawn at any time by writing to the academy.",
      "Excel Pro does not publish a minor's full name alongside disciplinary information, and does not share contact details publicly.",
    ],
  },
  {
    heading: "19. Supervision, drop-off and pick-up",
    paras: [
      "Coaching staff supervise players during scheduled sessions and matches only. Parents are responsible for their child before and after that window and must collect players promptly. Players may not leave a venue before the session ends without a parent's knowledge.",
      "Transport to away matches and tournaments is the family's responsibility unless Excel Pro states otherwise in writing for a specific event.",
    ],
  },
  {
    heading: "20. Cancellations and weather",
    paras: [
      "Sessions may be cancelled for weather, field conditions or facility closures, and are communicated as early as possible. Cancelled sessions may be rescheduled where a field is available. Where they cannot be, no refund is issued for individual sessions.",
    ],
  },
  {
    heading: "21. Safe sport and respectful environment",
    paras: [
      "Excel Pro does not tolerate harassment, bullying, discrimination or abuse of any kind, by anyone — player, parent, coach or staff. Concerns can be raised with the Head Coach or the academy at 647-703-7821 and will be taken seriously and handled confidentially.",
    ],
  },
  {
    heading: "22. Privacy",
    paras: [
      "Information collected at registration is used to register players with the league and Ontario Soccer, to contact families, and to run the academy's programs. It is not sold or shared with third parties except as required for league and Ontario Soccer registration.",
    ],
  },
  {
    heading: "23. Discipline and removal",
    paras: [
      "Excel Pro may suspend or remove a player or a family from the program for repeated breaches of this agreement, abusive conduct toward staff, players or officials, or non-payment of fees.",
    ],
  },
];
