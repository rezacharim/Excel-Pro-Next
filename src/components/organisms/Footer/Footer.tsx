"use client";
import React from "react";
import Logo from "../../atoms/Logo/Logo";
import Menu from "../../molecules/Menu/Menu";
import Link from "next/link";
import InstagramIcon from "@/components/atoms/Icons/InstagramIcon";
import ContactInfoCard from "@/components/molecules/ContactInfo/ContactInfo";

const Footer = () => {
  return (
    <footer className="w-full bg-secondary px-6 lg:px-14 md:px-8 py-8 border-t">
      <div className="container mx-auto">
        {/* Desktop View - Hidden on Mobile */}
        <div className="hidden md:flex items-center justify-between">
          {/* Logo - Left */}
          <div className="flex-1">
            <div className="flex">
              <Logo />
              <p className="flex items-center ml-3 text-primary max-w-xs lg:flex md:hidden">
                Excel Pro Academy
              </p>
            </div>
          </div>

          {/* Menu - Center */}
          <div className="flex-1 flex justify-center">
            <Menu variant="footer" orientation="horizontal" />
          </div>

          {/* Social Media - Right */}
          <div className="flex-1 flex flex-col items-end">
            <div className="flex gap-4">
              <Link
                href="https://www.instagram.com/excel.pro.soccer.academy?igsh=MWp5MjRvZWFvN3Jlaw=="
                aria-label="Instagram"
                className="text-white hover:text-primary transition-colors"
              >
                <InstagramIcon size={24} />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile View - Hidden on Desktop */}
        <div className="md:hidden">
          <div className="flex justify-between items-center mb-6">
            {/* Logo - Left */}
            <div>
              <Logo />
            </div>

            <div>
              <div className="flex gap-3">
                <Link
                  href="https://www.instagram.com/excel.pro.soccer.academy?igsh=MWp5MjRvZWFvN3Jlaw=="
                  aria-label="Instagram"
                  className="text-white hover:text-primary transition-colors"
                >
                  <InstagramIcon size={24} />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Row: Menu */}
          <div className="mt-4 border-t pt-4 text-center">
            <Menu variant="footer" orientation="vertical" />
          </div>

          {/* Contact Info with proper containment */}
          <div className="flex justify-center my-4">
            <div className="w-full max-w-xs">
              <ContactInfoCard />
            </div>
          </div>
        </div>

        {/* Copyright - Both Views */}
        <div className="mt-8 pt-4 border-t text-center text-white text-sm">
          <p>
            © {new Date().getFullYear()} Excel Pro Academy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
