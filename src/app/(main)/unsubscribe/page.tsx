import type { Metadata } from "next";
import Unsubscribe from "@/components/template/Unsubscribe/Unsubscribe";

export const metadata: Metadata = {
  title: "Unsubscribe | Excel Pro Soccer Academy",
  robots: { index: false, follow: false },
};

const UnsubscribePage = () => <Unsubscribe />;

export default UnsubscribePage;
