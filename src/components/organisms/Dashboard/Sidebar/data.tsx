import {
  BarChart3,
  CreditCard,
  History,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  PiggyBank,
  Settings,
  ClipboardList,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import { NavigationItemsTypes } from "./types";
import { BiPhotoAlbum } from "react-icons/bi";
import { AlertTriangle } from "lucide-react";

/**
 * Dashboard menu, ordered by how often the academy actually uses it:
 * day-to-day running of the club first, content second, admin/setup last.
 */
export const navigationItems: NavigationItemsTypes[] = [
  {
    id: 0,
    icon: <BarChart3 className="w-5 h-5 text-gray-500" />,
    label: "Overview",
    active: true,
  },
  {
    id: 8,
    icon: <Users className="w-5 h-5 text-gray-500" />,
    label: "Memberships",
    active: false,
  },
  {
    id: 14,
    icon: <ClipboardList className="w-5 h-5 text-gray-500" />,
    label: "League",
    active: false,
  },
  {
    id: 10,
    icon: <AlertTriangle className="w-5 h-5 text-gray-500" />,
    label: "Collections",
    active: false,
  },
  {
    id: 11,
    icon: <PiggyBank className="w-5 h-5 text-gray-500" />,
    label: "Money",
    active: false,
  },
  {
    id: 5,
    icon: <CreditCard className="w-5 h-5 text-gray-500" />,
    label: "Payments",
    active: false,
  },
  {
    id: 9,
    icon: <Megaphone className="w-5 h-5 text-gray-500" />,
    label: "Announcements",
    active: false,
  },
  {
    id: 3,
    icon: <MessageCircle className="w-5 h-5 text-gray-500" />,
    label: "Messages",
    active: false,
  },
  {
    id: 4,
    icon: <BiPhotoAlbum className="w-5 h-5 text-gray-500" />,
    label: "Gallery",
    active: false,
  },
  {
    id: 6,
    icon: <Trophy className="w-5 h-5 text-gray-500" />,
    label: "Player of the Month",
    active: false,
  },
  {
    id: 2,
    icon: <LayoutGrid className="w-5 h-5 text-gray-500" />,
    label: "Match's",
    active: false,
  },
  {
    id: 12,
    icon: <UserCog className="w-5 h-5 text-gray-500" />,
    label: "Admin Users",
    active: false,
  },
  {
    id: 13,
    icon: <History className="w-5 h-5 text-gray-500" />,
    label: "Activity Log",
    active: false,
  },
  {
    id: 7,
    icon: <Settings className="w-5 h-5 text-gray-500" />,
    label: "Settings",
    active: false,
  },
];
