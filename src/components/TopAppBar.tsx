import React from "react";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

interface TopAppBarProps {
  onLogout: () => void;
}

interface UserWithCustomFields {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  username?: string | null;
  displayUsername?: string | null;
  nip?: string;
  pangkatGolongan?: string;
  jabatan?: string;
  unitKerja?: string;
  tandaTangan?: string;
}

export default function TopAppBar({ onLogout }: TopAppBarProps) {
  const router = useRouter();
  const { setIsLoading, setLoadingMsg } = useApp();
  const { data: session } = authClient.useSession();
  const user = session?.user as UserWithCustomFields | undefined;

  const displayName = user?.name || "Budi Santoso";
  const displayNip = user?.nip ? `NIP ${user.nip}` : "NIP 19800101";
  const avatarUrl = user?.image || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";

  const handleProfileClick = () => {
    setLoadingMsg("Memuat pengaturan akun...");
    setIsLoading(true);
    setTimeout(() => {
      router.push("/account");
    }, 350);
  };

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
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2.5 bg-surface-container-low/70 border border-outline-variant/60 rounded-full pl-1.5 pr-3.5 py-1.5 hover:bg-surface-container-high/60 hover:border-outline-variant transition-all select-none shadow-sm cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
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
          </button>

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
