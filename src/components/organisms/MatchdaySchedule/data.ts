// data.ts
export interface MatchData {
  id: string;
  teams: string[];
  location: string;
  address: string;
  date: string;
  ageGroup: string;
}

export const matchdayData: MatchData[] = [
  {
    id: "match-001",
    teams: ["Eagles FC", "Rangers United"],
    location: "Community Field",
    address: "123 Sports Ave, Sportsville",
    date: "3/3/25 11:00 AM",
    ageGroup: "U7 - U12"
  },
  {
    id: "match-002",
    teams: ["Lions SC", "Strikers FC"],
    location: "Central Stadium",
    address: "456 Main St, Downtown",
    date: "5/3/25 2:00 PM",
    ageGroup: "U15 - U17"
  },
  {
    id: "match-003",
    teams: ["Thunders FC", "Dynamo Youth"],
    location: "Eastern Fields",
    address: "789 Park Rd, Eastside",
    date: "22/3/25 4:00 PM",
    ageGroup: "U13 - U14"
  },
  {
    id: "match-004",
    teams: ["Galaxy FC", "United Youth"],
    location: "Western Complex",
    address: "101 Western Blvd, Westside",
    date: "7/3/25 10:00 AM",
    ageGroup: "U7 - U12"
  },
  {
    id: "match-005",
    teams: ["Rovers Academy", "Victory FC"],
    location: "Northern Arena",
    address: "202 North Way, Northside",
    date: "12/3/25 1:00 PM",
    ageGroup: "U13 - U14"
  },
  {
    id: "match-006",
    teams: ["Warriors SC", "Phoenix Youth"],
    location: "Southern Fields",
    address: "303 South St, Southside",
    date: "15/3/25 3:00 PM",
    ageGroup: "U15 - U17"
  },
  {
    id: "match-007",
    teams: ["Academic FC", "Heritage United"],
    location: "School Stadium",
    address: "404 Education Rd, College Town",
    date: "19/3/25 5:00 PM",
    ageGroup: "U15 - U17"
  },
  {
    id: "match-008",
    teams: ["Junior FC", "Mini Kickers"],
    location: "Junior Complex",
    address: "505 Youth Way, Kidsville",
    date: "24/3/25 9:00 AM",
    ageGroup: "U7 - U12"
  },
  {
    id: "match-009",
    teams: ["Teens United", "Adolescent FC"],
    location: "Teen Arena",
    address: "606 Teen Dr, Teenville",
    date: "27/3/25 4:30 PM",
    ageGroup: "U13 - U14"
  },
  {
    id: "match-010",
    teams: ["Senior Youth", "Almost Adults FC"],
    location: "Senior Stadium",
    address: "707 Mature Ln, Maturity",
    date: "31/3/25 6:00 PM",
    ageGroup: "U15 - U17"
  }
];