import type { Metadata } from "next";
import Dashboard from "@/components/template/Dashboard/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard | Excel Pro Soccer Academy",
  description: "Admin dashboard for Excel Pro Soccer Academy.",
  robots: {
    index: false,
    follow: false,
  },
};

const DashboardPage = () => {
  return (
    <main>
      <Dashboard />
    </main>
  );
};

export default DashboardPage;
