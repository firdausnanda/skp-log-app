"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import HomeTab from "@/components/HomeTab";

export default function Home() {
  const router = useRouter();
  const { rhkCount, rhkProgress, activitiesCount, buktiDukungCount, setIsLoading, setLoadingMsg } = useApp();

  const handleAddClick = () => {
    setLoadingMsg("Memuat halaman...");
    setIsLoading(true);
    setTimeout(() => {
      router.push("/rhk");
    }, 350);
  };

  const handleReportClick = () => {
    setLoadingMsg("Memuat halaman...");
    setIsLoading(true);
    setTimeout(() => {
      router.push("/reports");
    }, 350);
  };

  return (
    <HomeTab
      rhkCount={rhkCount}
      rhkProgress={rhkProgress}
      activitiesCount={activitiesCount}
      buktiDukungCount={buktiDukungCount}
      onAddClick={handleAddClick}
      onReportClick={handleReportClick}
    />
  );
}
