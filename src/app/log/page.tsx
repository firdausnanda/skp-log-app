"use client";

import React, { Suspense } from "react";
import LogTab from "@/components/LogTab";

export default function LogPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-8 bg-surface-container-lowest border border-outline-variant rounded-2xl animate-pulse-subtle">
        <span className="material-symbols-outlined text-[48px] text-primary mb-2">find_in_page</span>
        <p className="text-sm text-outline">Memuat halaman Logbook...</p>
      </div>
    }>
      <LogTab />
    </Suspense>
  );
}
