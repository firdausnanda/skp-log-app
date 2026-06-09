import React from "react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";

interface TopAppBarProps {
  onLogout: () => void;
}

export default function TopAppBar({ onLogout }: TopAppBarProps) {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;

  const displayName = user?.name || "Budi Santoso";
  const displayNip = user?.nip ? `NIP ${user.nip}` : "NIP 19800101";
  const avatarUrl = user?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuAhkUs7gmJxocZiGntAWMFFjcgXNCVe1ue5mQ-U8O7-ko4_X_MWe7GRCncFqTXzaO-wSi0DIWlWN9B60pfxNxwoqw9hKNx2OGRKIuBXfR9AVoZNyQb01TibV6fFtstYeCToWBSfN2GRlb9bzLxJovZy8at70eVj8enracF7FSfU3dte-wOBDzq_T8ms3fGXmqB-odVa32igzfBSIrJVkY57ZD5Ixx2adgoYQ4p___nPcKtQRH0j_E8pBB6UGBA6aX-goGwWlSn6Xl0y";

  return (
    <header className="bg-surface/85 backdrop-blur-md fixed top-0 left-0 right-0 w-full z-30 border-b border-outline-variant/75 shadow-sm transition-all duration-200">
      <div className="flex justify-between items-center px-4 h-16 w-full max-w-container-max mx-auto">
        {/* Left Side: Sleek Typographic Brand Logo (Stacked & Larger) */}
        <div className="flex flex-col gap-1 select-none">
          <span className="font-plus-jakarta-sans text-[19px] font-black tracking-tight text-on-surface leading-none">
            Work<span className="text-primary">log</span>
          </span>
          <span className="font-sans text-[10px] font-bold tracking-wider text-outline uppercase leading-none">
            Jurnal SKP
          </span>
        </div>

        {/* Right Side: Pill Profile Widget & Power Logout */}
        <div className="flex items-center gap-3">
          {/* Pill profile details widget */}
          <div className="flex items-center gap-2.5 bg-surface-container-low/70 border border-outline-variant/60 rounded-full pl-1.5 pr-3.5 py-1.5 hover:bg-surface-container-high/60 transition-all select-none shadow-sm">
            <Image
              alt="User profile photo"
              className="w-7 h-7 rounded-full object-cover border border-outline-variant/80"
              src={avatarUrl}
              width={28}
              height={28}
              unoptimized
            />
            <div className="flex flex-col text-left">
              <span className="font-sans text-[11px] font-bold text-on-surface leading-none mb-0.5">
                {displayName}
              </span>
              <span className="font-sans text-[9px] text-outline font-semibold leading-none">
                {displayNip}
              </span>
            </div>
          </div>

          {/* Logout Action: Circle Power Button */}
          <button
            onClick={onLogout}
            title="Keluar dari Aplikasi"
            className="w-9 h-9 border border-outline-variant/70 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error/10 hover:border-error/25 transition-all cursor-pointer active:scale-95 bg-surface-bright/50"
          >
            <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
          </button>
        </div>
      </div>
    </header>
  );
}
