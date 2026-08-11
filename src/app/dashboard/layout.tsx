"use client";
import { ReactNode, useState, useEffect } from "react";
import { Montserrat } from "next/font/google";
import Sidebar from "@/components/organisms/Dashboard/Sidebar/Sidebar";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import "../globals.css";

const montserrat = Montserrat({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <html lang="en-US">
      <head />
      <body className={`${montserrat.className} antialiased bg-gray-100`}>
        {/* Mobile Header with Hamburger */}
        <header className="lg:hidden flex items-center justify-between bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo/excelpro_logo_2.png"
              alt="Excel Pro Logo"
              width={36}
              height={36}
              className="object-contain"
            />
            <h1 className="text-xl font-bold text-gray-900">Excel Pro</h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </header>

        <div className="flex h-[calc(100vh-64px)] lg:h-screen">
          {/* Sidebar - Absolute on mobile, fixed on desktop */}
          <div 
            className={`
              fixed lg:relative z-10 h-full bg-white border-r
              transition-all duration-300
              ${sidebarOpen ? 'w-64 left-0' : '-left-64 lg:left-0 lg:w-0'}
            `}
          >
            <Sidebar isCollapsed={false} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          </div>
          
          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-0 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}