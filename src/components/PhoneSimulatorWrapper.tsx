"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import TopAppBar from "@/components/TopAppBar";
import BottomNavBar from "@/components/BottomNavBar";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function GlobalLoader({ loadingMsg }: { loadingMsg: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/30 backdrop-blur-md transition-all duration-300">
      <div className="loader-card-enter flex flex-col items-center gap-4 p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-lg max-w-[240px] w-full mx-4 text-center">
        {/* Sleek Minimalist Circular Spinner */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg className="w-10 h-10 animate-[spin_1.2s_linear_infinite]" viewBox="0 0 50 50">
            <defs>
              <linearGradient id="spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--green-700)" stopOpacity="1" />
                <stop offset="100%" stopColor="var(--green-900)" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            {/* Background Track */}
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="var(--color-outline-variant)"
              strokeWidth="2.5"
              className="opacity-20"
            />
            {/* Active Spinning Segment */}
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="url(#spinner-grad)"
              strokeWidth="3"
              strokeDasharray="85"
              strokeDashoffset="25"
              strokeLinecap="round"
            />
          </svg>
        </div>
        
        {/* Status Text */}
        <div className="space-y-1">
          <p className="font-headline-md text-sm text-on-surface font-semibold tracking-tight">
            {loadingMsg}
          </p>
          <p className="font-label-sm text-[9px] text-outline uppercase tracking-wider">
            Mohon Tunggu
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PhoneSimulatorWrapper({ children }: { children: React.ReactNode }) {
  const {
    showNotification,
    notificationMsg,
    triggerNotification,
    isLoading,
    setIsLoading,
    loadingMsg,
    setLoadingMsg,
  } = useApp();

  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  const [mounted, setMounted] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Dismiss loader on pathname changes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, setIsLoading]);

  // Register Service Worker in production
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.error("Service Worker registration failed:", err);
          });
      }
    }
  }, []);

  // Authentication Guard redirects
  useEffect(() => {
    if (!mounted || isPending) return;

    if (!session && !isLoginPage) {
      router.replace("/login");
    } else if (session && isLoginPage) {
      router.replace("/");
    }
  }, [session, isPending, isLoginPage, router, mounted]);

  const handleLogout = async () => {
    setLoadingMsg("Keluar dari akun...");
    setIsLoading(true);
    try {
      await authClient.signOut();
      triggerNotification("Anda berhasil keluar.");
      router.push("/login");
    } catch (err) {
      console.error(err);
      triggerNotification("Gagal keluar dari akun.");
    } finally {
      setIsLoading(false);
    }
  };

  // Guard renders to prevent unauthorized views/flickers
  if (!mounted) {
    return <GlobalLoader loadingMsg="Memuat..." />;
  }

  if (isPending) {
    return <GlobalLoader loadingMsg="Memverifikasi sesi..." />;
  }

  if (!session && !isLoginPage) {
    return <GlobalLoader loadingMsg="Mengarahkan ke halaman login..." />;
  }

  if (session && isLoginPage) {
    return <GlobalLoader loadingMsg="Mengarahkan ke dashboard..." />;
  }

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-background text-on-background font-sans antialiased flex flex-col relative">
        {/* Toast Notification */}
        {showNotification && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-secondary-container border border-on-secondary-container/20 text-on-secondary-container p-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-bounce mx-4">
            <span className="material-symbols-outlined text-secondary">check_circle</span>
            <span className="text-sm font-medium">{notificationMsg}</span>
          </div>
        )}

        <main className="grow flex flex-col">
          {children}
        </main>

        {/* Global Loader Overlay */}
        {isLoading && <GlobalLoader loadingMsg={loadingMsg} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-sans antialiased flex flex-col relative">
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-secondary-container border border-on-secondary-container/20 text-on-secondary-container p-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-bounce mx-4">
          <span className="material-symbols-outlined text-secondary">check_circle</span>
          <span className="text-sm font-medium">{notificationMsg}</span>
        </div>
      )}

      {/* TopAppBar */}
      <TopAppBar onLogout={handleLogout} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pt-24 pb-28">
        {children}
      </main>

      {/* BottomNavBar */}
      <BottomNavBar />

      {/* Global Loader Overlay */}
      {isLoading && <GlobalLoader loadingMsg={loadingMsg} />}
    </div>
  );
}
