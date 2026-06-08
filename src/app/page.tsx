"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import HomeTab from "@/components/HomeTab";

export default function Home() {
  const { rhkCount, activitiesCount, setShowAddModal, triggerNotification } = useApp();

  return (
    <HomeTab
      rhkCount={rhkCount}
      activitiesCount={activitiesCount}
      onAddClick={() => setShowAddModal(true)}
      onReportClick={() => triggerNotification("Menyiapkan dokumen laporan...")}
    />
  );
}
