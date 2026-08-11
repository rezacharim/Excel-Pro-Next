"use client";
import { NextPage } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems } from "./data";
import clsx from "clsx";

interface MenuProps {
  variant?: "default" | "footer";
  orientation?: "horizontal" | "vertical";
  onClicked?: () => void;
}

const Menu: NextPage<MenuProps> = ({
  variant = "default",
  orientation = "horizontal",
  onClicked,
}) => {
  const pathname = usePathname();

  const variants = {
    default: {
      textColor: "text-[#393939]",
      activeTextColor: "text-[#151313]",
      hoverColor: "hover:text-primary",
      showIndicator: true,
    },
    footer: {
      textColor: "text-white",
      activeTextColor: "text-white font-bold",
      hoverColor: "hover:text-primary",
      showIndicator: false,
    },
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <nav>
      <ul
        className={clsx(
          "flex",
          orientation === "horizontal"
            ? "md:flex-row md:space-x-14 space-y-4 md:space-y-0"
            : "flex-col space-y-4"
        )}
      >
        {menuItems.map((item) => (
          <li key={item.id} onClick={onClicked}>
            <Link
              href={item.href}
              className={clsx(
                "relative font-montserrat transition-all duration-300 whitespace-nowrap",
                pathname === item.href
                  ? currentVariant.activeTextColor
                  : `${currentVariant.textColor} ${currentVariant.hoverColor}`
              )}
            >
              {item.label}
              {pathname === item.href && currentVariant.showIndicator && (
                <span
                  className={
                    "absolute top-0 w-2 h-2 bg-primary rounded-full right-[-12px]"
                  }
                />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Menu;
