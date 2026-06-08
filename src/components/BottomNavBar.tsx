"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setIsLoading, setLoadingMsg } = useApp();

  const isActive = (path: string) => pathname === path;

  const handleNav = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (pathname === path) return;
    setLoadingMsg("Memuat halaman...");
    setIsLoading(true);
    setTimeout(() => {
      router.push(path);
    }, 350); // 350ms delay for visual feedback, will be auto dismissed in wrapper
  };

  return (
    <nav className="bg-surface-container/95 backdrop-blur-md fixed bottom-0 left-0 right-0 w-full z-30 border-t border-outline-variant shadow-lg">
      <div className="max-w-4xl mx-auto w-full flex justify-around items-center h-20 pb-safe px-2">
        <button
          onClick={(e) => handleNav(e, "/")}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer border-none bg-transparent ${
            isActive("/")
              ? "bg-secondary-container text-on-secondary-container font-semibold"
              : "text-on-surface-variant hover:bg-surface-variant/50"
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={isActive("/") ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            home
          </span>
          <span className="font-label-sm text-[10px] mt-0.5 font-medium">Home</span>
        </button>

        <button
          onClick={(e) => handleNav(e, "/rhk")}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer border-none bg-transparent ${
            isActive("/rhk")
              ? "bg-secondary-container text-on-secondary-container font-semibold"
              : "text-on-surface-variant hover:bg-surface-variant/50"
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={isActive("/rhk") ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            assignment
          </span>
          <span className="font-label-sm text-[10px] mt-0.5 font-medium">RHK</span>
        </button>

        <button
          onClick={(e) => handleNav(e, "/log")}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer border-none bg-transparent ${
            isActive("/log")
              ? "bg-secondary-container text-on-secondary-container font-semibold"
              : "text-on-surface-variant hover:bg-surface-variant/50"
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={isActive("/log") ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            edit_note
          </span>
          <span className="font-label-sm text-[10px] mt-0.5 font-medium">Log</span>
        </button>

        <button
          onClick={(e) => handleNav(e, "/reports")}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer border-none bg-transparent ${
            isActive("/reports")
              ? "bg-secondary-container text-on-secondary-container font-semibold"
              : "text-on-surface-variant hover:bg-surface-variant/50"
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={isActive("/reports") ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            assessment
          </span>
          <span className="font-label-sm text-[10px] mt-0.5 font-medium">Reports</span>
        </button>
      </div>
    </nav>
  );
}
