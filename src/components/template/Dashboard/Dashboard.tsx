"use client";

import { useEffect } from "react";
import Cookie from "js-cookie";
import { useMenuStore } from "@/stores/dashboardStore";
import Matches from "@/components/organisms/Dashboard/Matchs/Matchs";
import Overview from "@/components/organisms/Dashboard/Overview/Overview";
import Messages from "@/components/organisms/Dashboard/Messages/Messages";
import Gallery from "@/components/organisms/Dashboard/Gallery/Gallery";
import { useRouter } from "next/navigation";
import Payment from "@/components/organisms/Dashboard/Payment/Payment";
import PlayerMonthGallery from "@/components/organisms/Dashboard/PlayerMonthGallery/PlayerMonthGallery";
import Setting from "@/components/organisms/Dashboard/Setting/Setting";
import Memberships from "@/components/organisms/Dashboard/Memberships/Memberships";
import Announcements from "@/components/organisms/Dashboard/Announcements/Announcements";
import Finance from "@/components/organisms/Dashboard/Finance/Finance";
import Collections from "@/components/organisms/Dashboard/Collections/Collections";
import Admins from "@/components/organisms/Dashboard/Admins/Admins";
import Activity from "@/components/organisms/Dashboard/Activity/Activity";
import League from "@/components/organisms/Dashboard/League/League";
import CoachesAdmin from "@/components/organisms/Dashboard/Coaches/Coaches";
import TestimonialsAdmin from "@/components/organisms/Dashboard/Testimonials/Testimonials";
import FixturesAdmin from "@/components/organisms/Dashboard/Fixtures/Fixtures";
import TeamsAdmin from "@/components/organisms/Dashboard/Teams/Teams";

const Dashboard = () => {
  const { activeMenuId } = useMenuStore();
  const savedToken = Cookie.get("auth_token");
  const router = useRouter();

  useEffect(() => {
    if (!savedToken) {
      router.push("/");
    }
  }, [router, savedToken]);

  return (
    <section>
      {activeMenuId === 0 ? (
        <Overview />
      ) : activeMenuId === 2 ? (
        <Matches />
      ) : activeMenuId === 3 ? (
        <Messages />
      ) : activeMenuId === 4 ? (
        <Gallery />
      ) : activeMenuId === 5 ? (
        <Payment />
      ) : activeMenuId === 6 ? (
        <PlayerMonthGallery />
      ) : activeMenuId === 7 ? (
        <Setting />
      ) : activeMenuId === 8 ? (
        <Memberships />
      ) : activeMenuId === 9 ? (
        <Announcements />
      ) : activeMenuId === 10 ? (
        <Collections />
      ) : activeMenuId === 11 ? (
        <Finance />
      ) : activeMenuId === 12 ? (
        <Admins />
      ) : activeMenuId === 13 ? (
        <Activity />
      ) : activeMenuId === 14 ? (
        <League />
      ) : activeMenuId === 15 ? (
        <CoachesAdmin />
      ) : activeMenuId === 16 ? (
        <TestimonialsAdmin />
      ) : activeMenuId === 17 ? (
        <FixturesAdmin />
      ) : activeMenuId === 18 ? (
        <TeamsAdmin />
      ) : (
        ""
      )}
    </section>
  );
};

export default Dashboard;
