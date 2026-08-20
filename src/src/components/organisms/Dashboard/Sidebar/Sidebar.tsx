"use client";
import { NextPage } from "next";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { navigationItems } from "./data";
import { useMenuStore } from "@/stores/dashboardStore";
import useAuthModel from "@/hooks/useAuthModel";

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: NextPage<SidebarProps> = ({ toggleSidebar }) => {
  const router = useRouter();
  
  // Get both the activeMenuId and the setter from your store
  const { activeMenuId, setActiveMenuId } = useMenuStore();
  const { logout } = useAuthModel();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo Section - Hidden on mobile (shown in header) */}
      <div className="hidden lg:flex p-4 border-b">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/images/logo/excelpro_logo_2.png"
            alt="Excel Pro Logo"
            width={36}
            height={36}
            className="object-contain"
          />
          <h1 className="text-xl font-bold text-gray-900">Excel Pro</h1>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-2 py-6 space-y-1 overflow-y-auto">
        {navigationItems.map((item, index) => (
          <div
            key={index}
            className={`flex items-center px-4 py-3 text-gray-700 rounded-lg cursor-pointer ${
              activeMenuId === item.id ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
            onClick={() => {
              setActiveMenuId(item.id);
              if (window.innerWidth < 1024) {
                toggleSidebar();
              }
            }}
          >
            <div className="mr-3">{item.icon}</div>
            <span className="font-medium">{item.label}</span>
          </div>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t mt-auto">
        <div className="flex items-center justify-between">
          <LogOut className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => {
            logout();
            router.refresh();
          }} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;