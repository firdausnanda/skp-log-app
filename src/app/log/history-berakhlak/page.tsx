"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { useApp } from "@/context/AppContext";

const coreValues = [
  "Berorientasi Pelayanan",
  "Akuntabel",
  "Kompeten",
  "Harmonis",
  "Loyal",
  "Adaptif",
  "Kolaboratif",
];

const yearOptions = [
  { value: "2026", label: "2026" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
];

const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    borderColor: "var(--color-outline-variant)",
    backgroundColor: "var(--color-surface-container-lowest)",
    borderRadius: "9999px",
    minHeight: "32px",
    height: "32px",
    fontSize: "13px",
    fontWeight: "600",
    width: "110px",
    boxShadow: "none",
    fontFamily: "var(--font-sans)",
    "&:hover": {
      borderColor: "var(--color-outline)"
    }
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    padding: "0 6px",
    height: "30px",
    display: "flex",
    alignItems: "center",
  }),
  indicatorsContainer: (provided: any) => ({
    ...provided,
    height: "30px",
  }),
  dropdownIndicator: (provided: any) => ({
    ...provided,
    padding: "2px",
    color: "var(--color-on-surface)",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "var(--color-surface-container-lowest)",
    borderRadius: "0.5rem",
    border: "1px solid var(--color-outline-variant)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    width: "110px",
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "var(--color-primary)"
      : state.isFocused
      ? "var(--color-surface-container-low)"
      : "transparent",
    color: state.isSelected
      ? "var(--color-on-primary)"
      : "var(--color-on-surface)",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    padding: "6px 12px",
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "var(--color-on-surface)",
  }),
};

export default function RiwayatJurnalPage() {
  const router = useRouter();
  const { activities, triggerNotification, setEditingActivity, setActivityCategoryPreset, setIsLoading, setLoadingMsg } = useApp();
  const [selectedYear, setSelectedYear] = useState("2026");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Heuristic parser to detect which Core Value the activity represents
  const getCoreValueFromTitle = (title: string): string | null => {
    for (const val of coreValues) {
      if (title.startsWith(`[${val}] `)) {
        return val;
      }
    }
    // Fallback based on content keywords
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("pelayanan")) return "Berorientasi Pelayanan";
    if (lowerTitle.includes("akuntabel") || lowerTitle.includes("kinerja")) return "Akuntabel";
    if (lowerTitle.includes("kompeten") || lowerTitle.includes("sistem")) return "Kompeten";
    if (lowerTitle.includes("harmonis") || lowerTitle.includes("rapat")) return "Harmonis";
    if (lowerTitle.includes("loyal")) return "Loyal";
    if (lowerTitle.includes("adaptif") || lowerTitle.includes("integrasi") || lowerTitle.includes("layout")) return "Adaptif";
    if (lowerTitle.includes("kolaboratif") || lowerTitle.includes("koordinasi")) return "Kolaboratif";
    
    return "Berorientasi Pelayanan"; // Default fallback
  };

  const getMonthlyData = (year: number) => {
    const monthsList = [
      { name: "Desember", index: 11, defaultPoints: 7 },
      { name: "November", index: 10, defaultPoints: 7 },
      { name: "Oktober", index: 9, defaultPoints: 7 },
      { name: "September", index: 8, defaultPoints: 7 },
      { name: "Agustus", index: 7, defaultPoints: 7 },
      { name: "Juli", index: 6, defaultPoints: 7 },
      { name: "Juni", index: 5, defaultPoints: 2 }, // June 2026 starts with 2 points as baseline
      { name: "Mei", index: 4, defaultPoints: 7 },
      { name: "April", index: 3, defaultPoints: 7 },
      { name: "Maret", index: 2, defaultPoints: 4 },
      { name: "Februari", index: 1, defaultPoints: 7 },
      { name: "Januari", index: 0, defaultPoints: 7 }
    ];

    const currentYear = new Date().getFullYear(); // 2026
    const currentMonthIndex = new Date().getMonth(); // 5 (June)

    // Filter list: for current year, only show months that have occurred
    let filteredMonths = monthsList;
    if (year === currentYear) {
      filteredMonths = monthsList.filter(m => m.index <= currentMonthIndex);
    }

    return filteredMonths.map(month => {
      // Find context activities in this month & year
      const monthActivities = activities.filter(act => {
        if (act.category !== "BerAKHLAK") return false;
        const actDate = new Date(act.date);
        return actDate.getFullYear() === year && actDate.getMonth() === month.index;
      });

      // Calculate dynamic points from actual activities
      const uniqueValues = new Set<string>();
      monthActivities.forEach(act => {
        const val = getCoreValueFromTitle(act.title);
        if (val) uniqueValues.add(val);
      });

      // Use actual points, or fallback to mock data if there are no logs for that month
      let points = uniqueValues.size;
      if (monthActivities.length === 0) {
        points = month.defaultPoints;
      }

      const isComplete = points === 7;
      const status = isComplete ? "Selesai" : "Perlu Dilengkapi";
      const percent = Math.round((points / 7) * 100);

      return {
        name: `${month.name} ${year}`,
        monthIndex: month.index,
        points,
        percent,
        status,
        isComplete
      };
    });
  };

  const monthlyData = getMonthlyData(parseInt(selectedYear));
  const lengkapCount = monthlyData.filter(m => m.isComplete).length;
  const perluDilengkapiCount = monthlyData.filter(m => !m.isComplete).length;

  const handleBack = () => {
    setLoadingMsg("Kembali...");
    setIsLoading(true);
    setTimeout(() => {
      router.push("/log");
    }, 350);
  };

  const handleAddNewJournal = () => {
    setEditingActivity(null);
    setActivityCategoryPreset("BerAKHLAK");
    setLoadingMsg("Memuat halaman...");
    setIsLoading(true);
    setTimeout(() => {
      router.push("/log/add-berakhlak");
    }, 350);
  };

  const handleDetailNav = (monthName: string) => {
    setLoadingMsg("Memuat riwayat...");
    setIsLoading(true);
    setTimeout(() => {
      router.push(`/log/history-berakhlak/detail?month=${encodeURIComponent(monthName)}`);
    }, 350);
  };

  return (
    <div className="w-full flex flex-col gap-6 relative">
      {/* Page Header Back Nav */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="p-1 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant flex items-center justify-center cursor-pointer border-none bg-transparent"
          aria-label="Kembali"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <span className="font-headline-md text-headline-md text-primary font-bold">Logbook</span>
      </div>

      {/* Contextual Page Title */}
      <div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background font-bold">
          Riwayat Jurnal
        </h1>
        <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed">
          Pantau status pengisian jurnal bulanan Anda.
        </p>
      </div>

      {/* Summary Stats Bento Box */}
      <div className="grid grid-cols-2 gap-3">
        {/* Lengkap Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 shadow-sm rounded-xl p-3.5 flex items-center gap-3">
          <div className="bg-[#D1FAE5] rounded-full p-2 flex items-center justify-center text-[#065F46]">
            <span
              className="material-symbols-outlined text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-on-surface leading-none">{lengkapCount}</p>
            <p className="font-label-sm text-[11px] text-on-surface-variant font-medium mt-0.5">Lengkap</p>
          </div>
        </div>

        {/* Perlu Dilengkapi Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 shadow-sm rounded-xl p-3.5 flex items-center gap-3">
          <div className="bg-error-container rounded-full p-2 flex items-center justify-center text-on-error-container">
            <span
              className="material-symbols-outlined text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              error
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-on-surface leading-none">{perluDilengkapiCount}</p>
            <p className="font-label-sm text-[11px] text-on-surface-variant font-medium mt-0.5">Perlu Dilengkapi</p>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex justify-between items-center py-1 border-b border-outline-variant/20">
        <div className="flex items-center gap-1.5 text-on-surface-variant">
          <span className="material-symbols-outlined text-lg">filter_list</span>
          <span className="font-label-sm text-xs font-semibold">Tahun</span>
        </div>
        
        <Select
          instanceId="year-filter-select"
          value={yearOptions.find((opt) => opt.value === selectedYear) || yearOptions[0]}
          onChange={(val) => setSelectedYear(val ? val.value : "2026")}
          options={yearOptions}
          styles={customSelectStyles}
          isSearchable={false}
          menuPortalTarget={isMounted ? document.body : null}
        />
      </div>

      {/* Journal List */}
      <div className="flex flex-col gap-3.5 pb-16">
        {monthlyData.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => handleDetailNav(item.name)}
            className="bg-surface-container-lowest border border-outline-variant/60 shadow-sm rounded-xl p-4 flex flex-col gap-3 text-left hover:shadow-md transition-shadow active:bg-surface-variant relative overflow-hidden group border-none cursor-pointer w-full"
          >
            {/* Click hover visual state overlay */}
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors pointer-events-none" />

            <div className="flex justify-between items-start w-full relative z-10">
              <div>
                <h3 className="font-label-md text-sm text-on-surface font-bold">{item.name}</h3>
                <div className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  item.isComplete
                    ? "bg-[#D1FAE5] text-[#065F46]"
                    : "bg-error-container text-on-error-container"
                }`}>
                  {item.status}
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors text-xl">
                chevron_right
              </span>
            </div>

            <div className="w-full mt-1.5 relative z-10">
              <div className="flex justify-between items-center mb-1">
                <span className="font-body-sm text-xs text-on-surface-variant font-medium">Poin Evaluasi</span>
                <span className={`font-label-sm text-xs font-bold ${item.isComplete ? "text-secondary" : "text-error"}`}>
                  {item.points}/7 Poin
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    item.isComplete ? "bg-secondary" : "bg-error"
                  }`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Contextual FAB */}
      <div className="fixed bottom-24 right-4 z-40">
        <button
          onClick={handleAddNewJournal}
          className="bg-primary hover:bg-primary-container text-on-primary rounded-xl px-5 py-3 shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer border-none"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span className="font-label-md text-xs font-bold">Tambah Jurnal</span>
        </button>
      </div>
    </div>
  );
}
