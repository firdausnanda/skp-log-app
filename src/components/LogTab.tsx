"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, Activity } from "@/context/AppContext";
import { DayPicker } from "react-day-picker";
import { id } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { createPortal } from "react-dom";
import Select, { StylesConfig } from "react-select";

interface OptionType {
  value: string;
  label: string;
}

const customSelectStyles: StylesConfig<OptionType, false> = {
  container: (provided) => ({
    ...provided,
    width: "100%",
    "@media (min-width: 640px)": {
      width: "200px"
    }
  }),
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "var(--color-primary)" : "var(--color-outline-variant)",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(0, 35, 111, 0.15)" : "none",
    backgroundColor: "var(--color-surface)",
    borderRadius: "0.5rem",
    minHeight: "38px",
    height: "38px",
    fontSize: "12px",
    fontFamily: "var(--font-sans)",
    width: "100%",
    cursor: "pointer",
    "&:hover": {
      borderColor: "var(--color-outline)"
    }
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 8px 0 32px",
    height: "36px",
    display: "flex",
    alignItems: "center",
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: "36px",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "var(--color-surface-container-lowest)",
    borderRadius: "0.5rem",
    border: "1px solid var(--color-outline-variant)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    width: "280px",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "var(--color-primary)"
      : state.isFocused
      ? "var(--color-surface-container-low)"
      : "transparent",
    color: state.isSelected
      ? "var(--color-on-primary)"
      : "var(--color-on-surface)",
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "normal",
    wordBreak: "break-word",
    "&:active": {
      backgroundColor: "var(--color-primary-fixed)"
    }
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "var(--color-on-surface)",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "var(--color-outline)",
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
};

const periodSelectStyles: StylesConfig<OptionType, false> = {
  ...customSelectStyles,
  container: (provided) => ({
    ...provided,
    width: "100%",
    "@media (min-width: 640px)": {
      width: "150px"
    }
  }),
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "var(--color-primary)" : "var(--color-outline-variant)",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(0, 35, 111, 0.15)" : "none",
    backgroundColor: "var(--color-surface)",
    borderRadius: "0.5rem",
    minHeight: "38px",
    height: "38px",
    fontSize: "12px",
    fontFamily: "var(--font-sans)",
    width: "100%",
    cursor: "pointer",
    "&:hover": {
      borderColor: "var(--color-outline)"
    }
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 8px",
    height: "36px",
    display: "flex",
    alignItems: "center",
  }),
};

const getTodayAndYesterday = () => {
  const t = new Date();
  const y = new Date(t.getTime() - 86400000);
  return {
    todayStr: t.toISOString().split("T")[0],
    yesterdayStr: y.toISOString().split("T")[0],
  };
};

const { todayStr, yesterdayStr } = getTodayAndYesterday();

export default function LogTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    activities,
    setActivities,
    setActivityCategoryPreset,
    setEditingActivity,
    triggerNotification,
    showLoading,
    setIsLoading,
    setLoadingMsg,
    confirmAction,
    rhks,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().getFullYear().toString());
  const [lastResolvedRhkParam, setLastResolvedRhkParam] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(""); // "" means Semua Tanggal
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [rhkFilter, setRhkFilter] = useState(() => searchParams.get("rhk") || "all");

  const periodOptions = [
    { value: "2026", label: "Tahunan 2026" },
    { value: "2025", label: "Tahunan 2025" },
    { value: "2024", label: "Tahunan 2024" },
  ];

  const handlePeriodChange = (val: OptionType | null) => {
    const period = val ? val.value : new Date().getFullYear().toString();
    setLoadingMsg("Memfilter periode...");
    setIsLoading(true);
    setTimeout(() => {
      setSelectedPeriod(period);
      setRhkFilter("all");
      setIsLoading(false);
    }, 300);
  };

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
      });
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    
    const frameId = requestAnimationFrame(() => {
      handleResize();
      setIsMounted(true);
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (isDatePickerOpen) {
      updateCoords();
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
      return () => {
        window.removeEventListener("scroll", updateCoords, true);
        window.removeEventListener("resize", updateCoords);
      };
    }
  }, [isDatePickerOpen]);

  useEffect(() => {
    if (!isDatePickerOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile) return;
      const target = event.target as Node;
      const clickedInsideButton = datePickerRef.current && datePickerRef.current.contains(target);
      const clickedInsidePortal = portalRef.current && portalRef.current.contains(target);
      if (!clickedInsideButton && !clickedInsidePortal) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDatePickerOpen, isMobile]);

  // Search query logic with loading indicator
  useEffect(() => {
    if (searchQuery === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setIsLoading(false);
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch, setIsLoading]);

  useEffect(() => {
    const rhkParam = searchParams.get("rhk");
    if (!rhkParam) {
      if (lastResolvedRhkParam !== null) {
        requestAnimationFrame(() => {
          setLastResolvedRhkParam(null);
        });
      }
      return;
    }
    if (rhkParam !== lastResolvedRhkParam && rhks.length > 0) {
      const targetRhk = rhks.find(r => r.title === rhkParam);
      if (targetRhk) {
        setLoadingMsg("Menyinkronkan logbook...");
        setIsLoading(true);
        setTimeout(() => {
          setSelectedPeriod(targetRhk.period);
          setRhkFilter(targetRhk.title);
          setLastResolvedRhkParam(rhkParam);
          setIsLoading(false);
        }, 300);
      }
    }
  }, [searchParams, rhks, lastResolvedRhkParam, setIsLoading, setLoadingMsg]);

  const parseDateString = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getFormattedDateLabel = (dateStr: string) => {
    if (!dateStr) return "Semua Tanggal";
    try {
      const dateObj = parseDateString(dateStr);
      return dateObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setLoadingMsg("Memuat data...");
    setIsLoading(true);
    setTimeout(() => {
      if (activity.category === "BerAKHLAK") {
        router.push("/log/add-berakhlak");
      } else {
        router.push("/log/add-activity");
      }
    }, 350);
  };

  const handleDelete = (id: string, title: string) => {
    confirmAction({
      title: "Hapus Kegiatan",
      message: `Apakah Anda yakin ingin menghapus kegiatan "${title}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      isDanger: true,
      onConfirm: async () => {
        await showLoading("Menghapus kegiatan...", 800);
        try {
          const res = await fetch(`/api/activity?id=${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            setActivities((prev) => prev.filter((act) => act.id !== id));
            triggerNotification("Kegiatan berhasil dihapus.");
          } else {
            const err = await res.json();
            alert(`Gagal menghapus kegiatan: ${err.error}`);
          }
        } catch (error) {
          console.error(error);
          alert("Gagal menghapus kegiatan karena gangguan koneksi.");
        }
      },
    });
  };

  const openAddModal = (preset: "BerAKHLAK" | "Tugas Rutin" | null) => {
    setEditingActivity(null);
    setActivityCategoryPreset(preset);
    setLoadingMsg("Memuat halaman...");
    setIsLoading(true);
    setTimeout(() => {
      if (preset === "BerAKHLAK") {
        router.push("/log/add-berakhlak");
      } else {
        router.push("/log/add-activity");
      }
    }, 350);
  };

  const handleHistoryBerakhlakNav = () => {
    setLoadingMsg("Memuat halaman...");
    setIsLoading(true);
    setTimeout(() => {
      router.push("/log/history-berakhlak");
    }, 350);
  };

  const formatActivityDate = (dateStr: string) => {
    // Format: YYYY-MM-DD -> DD MMMM YYYY (e.g., 9 Juni 2026)
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
      ];
      const day = parseInt(parts[2]);
      const monthIndex = parseInt(parts[1]) - 1;
      const year = parts[0];
      return `${day} ${months[monthIndex]} ${year}`;
    }
    return dateStr;
  };

  const findAssociatedRhk = (rhkTitleOrId: string) => {
    // 1. Try exact title match
    let found = rhks.find((r) => r.title === rhkTitleOrId);
    if (found) return found;

    // 2. Try prefix "RHK #X" match for seeded activities
    const match = rhkTitleOrId.match(/^RHK\s*#\s*(\d+)/i);
    if (match) {
      found = rhks.find((r) => r.id === `rhk-${match[1]}`) || rhks[parseInt(match[1]) - 1];
      if (found) return found;
    }
    return undefined;
  };

  const rhkOptions = [
    { value: "all", label: "Semua RHK" },
    ...rhks
      .filter((r) => r.period === selectedPeriod)
      .map((r, index) => ({
        value: r.title,
        label: `RHK #${index + 1}: ${r.title}`,
      })),
  ];

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    if (act.category === "BerAKHLAK") return false;

    const matchesSearch =
      act.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      act.rhk.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesDate = !selectedDate || act.date === selectedDate;
    
    // Check if the activity's RHK belongs to the selected period
    const associatedRhk = findAssociatedRhk(act.rhk);
    const matchesPeriod = associatedRhk ? associatedRhk.period === selectedPeriod : true;

    let matchesRhk = true;
    if (rhkFilter !== "all") {
      const actRhkObj = findAssociatedRhk(act.rhk);
      matchesRhk = actRhkObj ? actRhkObj.title === rhkFilter : act.rhk === rhkFilter;
    }

    return matchesSearch && matchesDate && matchesPeriod && matchesRhk;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => openAddModal(null)}
          className="bg-primary text-on-primary font-label-md text-label-md rounded-lg h-12 flex items-center justify-center gap-2 w-full shadow-sm hover:bg-primary-container active:scale-[0.98] transition-all cursor-pointer border-none"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Input Kegiatan Baru
        </button>
        <button
          onClick={handleHistoryBerakhlakNav}
          className="bg-surface-container-lowest border border-outline-variant text-primary font-label-md text-label-md rounded-lg h-12 flex items-center justify-center gap-2 w-full shadow-sm hover:bg-surface-container-low active:scale-[0.98] transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">military_tech</span>
          Input Jurnal BerAKHLAK
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
        {/* Search */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              if (val !== debouncedSearch) {
                setLoadingMsg("Mencari kegiatan...");
                setIsLoading(true);
              }
            }}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-body-sm text-body-sm text-on-surface placeholder:text-outline transition-shadow"
            placeholder="Cari kegiatan..."
          />
        </div>

        {/* Responsive filters list */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Period Filter Dropdown Button */}
          <div className="relative flex items-center w-full sm:w-auto">
            <Select
              className="w-full"
              instanceId="log-period-select"
              value={periodOptions.find((opt) => opt.value === selectedPeriod) || null}
              onChange={handlePeriodChange}
              options={periodOptions}
              styles={periodSelectStyles}
              placeholder="Periode..."
              isSearchable={false}
              menuPortalTarget={isMounted ? document.body : null}
            />
          </div>

          {/* Date Filter Dropdown Button */}
          <div className="relative flex items-center w-full sm:w-auto" ref={datePickerRef}>
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setIsDatePickerOpen(prev => !prev)}
              className={`w-full sm:w-[180px] pl-10 pr-3 py-2 rounded-lg border font-label-sm text-label-sm hover:bg-surface-variant flex items-center justify-between gap-1.5 cursor-pointer focus:outline-none transition-all ${
                selectedDate 
                  ? "border-primary bg-primary-container/20 text-primary" 
                  : "border-outline-variant bg-surface text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined absolute left-2.5 pointer-events-none text-[18px]">
                calendar_today
              </span>
              <span className="truncate">{getFormattedDateLabel(selectedDate)}</span>
              {selectedDate ? (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    setLoadingMsg("Mengatur ulang tanggal...");
                    setIsLoading(true);
                    setTimeout(() => {
                      setSelectedDate("");
                      setIsDatePickerOpen(false);
                      setIsLoading(false);
                    }, 300);
                  }}
                  className="material-symbols-outlined text-[16px] hover:text-error transition-colors p-0.5 rounded-full hover:bg-surface-variant"
                >
                  close
                </span>
              ) : (
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                  arrow_drop_down
                </span>
              )}
            </button>

            {/* Popover/Modal content */}
            {isDatePickerOpen && isMounted && (
              <>
                {isMobile ? (
                  // Mobile Center Modal with Backdrop
                  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-[2px] animate-fade-in">
                    {/* Overlay Backdrop close handler */}
                    <div className="absolute inset-0 cursor-pointer" onClick={() => setIsDatePickerOpen(false)} />
                    
                    {/* Modal Card */}
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl p-4 max-w-[340px] w-full loader-card-enter z-50 flex flex-col items-center">
                      <div className="w-full flex items-center justify-between border-b border-outline-variant pb-2.5 mb-3">
                        <span className="font-headline-md text-sm text-on-surface font-bold">Filter Tanggal</span>
                        <button
                          type="button"
                          onClick={() => setIsDatePickerOpen(false)}
                          className="p-1 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                      
                      <DayPicker
                        mode="single"
                        selected={selectedDate ? parseDateString(selectedDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const formatted = formatDateToString(date);
                            setLoadingMsg("Memfilter tanggal...");
                            setIsLoading(true);
                            setTimeout(() => {
                              setSelectedDate(formatted);
                              setIsDatePickerOpen(false);
                              setIsLoading(false);
                            }, 300);
                          }
                        }}
                        locale={id}
                      />

                      {selectedDate && (
                        <button
                          type="button"
                          onClick={() => {
                            setLoadingMsg("Mengatur ulang tanggal...");
                            setIsLoading(true);
                            setTimeout(() => {
                              setSelectedDate("");
                              setIsDatePickerOpen(false);
                              setIsLoading(false);
                            }, 300);
                          }}
                          className="mt-3 w-full py-2 bg-surface border border-outline-variant text-error font-label-sm text-xs rounded-lg hover:bg-error-container/10 transition-colors cursor-pointer"
                        >
                          Hapus Filter Tanggal
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  // Desktop Dropdown via Portal
                  createPortal(
                    <div 
                      ref={portalRef}
                      style={{
                        position: "absolute",
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                      }}
                      className="z-[9999] bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-4 loader-card-enter w-fit flex flex-col items-center"
                    >
                      <DayPicker
                        mode="single"
                        selected={selectedDate ? parseDateString(selectedDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const formatted = formatDateToString(date);
                            setLoadingMsg("Memfilter tanggal...");
                            setIsLoading(true);
                            setTimeout(() => {
                              setSelectedDate(formatted);
                              setIsDatePickerOpen(false);
                              setIsLoading(false);
                            }, 300);
                          }
                        }}
                        locale={id}
                      />
                      {selectedDate && (
                        <button
                          type="button"
                          onClick={() => {
                            setLoadingMsg("Mengatur ulang tanggal...");
                            setIsLoading(true);
                            setTimeout(() => {
                              setSelectedDate("");
                              setIsDatePickerOpen(false);
                              setIsLoading(false);
                            }, 300);
                          }}
                          className="mt-2 w-full py-1.5 bg-surface border border-outline-variant text-error font-label-sm text-xs rounded-lg hover:bg-error-container/10 transition-colors cursor-pointer"
                        >
                          Hapus Filter Tanggal
                        </button>
                      )}
                    </div>,
                    document.body
                  )
                )}
              </>
            )}
          </div>

          {/* RHK Filter Dropdown Button */}
          <div className="relative flex items-center w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-2.5 pointer-events-none text-[18px] text-on-surface-variant z-10">
              filter_list
            </span>
            <Select
              className="w-full"
              instanceId="log-rhk-select"
              value={rhkOptions.find((opt) => opt.value === rhkFilter) || null}
              onChange={(val) => {
                const rhkVal = val ? val.value : "all";
                setLoadingMsg("Memfilter RHK...");
                setIsLoading(true);
                setTimeout(() => {
                  setRhkFilter(rhkVal);
                  setIsLoading(false);
                }, 300);
              }}
              options={rhkOptions}
              styles={customSelectStyles}
              placeholder="Pilih RHK..."
              isSearchable={false}
              menuPortalTarget={isMounted ? document.body : null}
            />
          </div>
        </div>
      </div>

      {/* Log List */}
      <div className="flex flex-col gap-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center p-8 bg-surface-container-lowest border border-outline-variant rounded-2xl">
            <span className="material-symbols-outlined text-[48px] text-outline/30 mb-2">find_in_page</span>
            <p className="text-sm text-outline">Tidak ada log kegiatan yang sesuai.</p>
          </div>
        ) : (
          filteredActivities.map((act) => (
            <div
              key={act.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden"
            >
              {/* Highlight Left Accent line */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                act.category === "BerAKHLAK" ? "bg-primary" : "bg-secondary"
              }`} />

              {/* Card Header */}
              <div className="flex justify-between items-center pl-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D1FAE5] text-[#065F46]`}>
                  Kegiatan
                </span>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(act)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-primary hover:bg-primary/10 active:scale-95 transition-all cursor-pointer border-none bg-transparent"
                    aria-label="Edit"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(act.id, act.title)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-error hover:bg-error/10 active:scale-95 transition-all cursor-pointer border-none bg-transparent"
                    aria-label="Delete"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>

              {/* Title / Description */}
              <h3 className="font-headline-md text-body-md text-on-surface font-semibold line-clamp-2 pl-1 leading-snug">
                {act.title}
              </h3>

              {/* Time */}
              <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-xs pl-1">
                <span className="material-symbols-outlined text-[16px] text-outline">calendar_today</span>
                <span>
                  Tanggal: {formatActivityDate(act.date)}
                </span>
              </div>

              {/* RHK Info Panel */}
              <div className="bg-surface p-3 rounded-lg border border-outline-variant/50 flex flex-col gap-1.5 ml-1">
                <div className="font-label-sm text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                  RHK Terkait:
                </div>
                <div className="font-body-sm text-xs text-on-surface line-clamp-2">
                  {act.rhk}
                </div>
              </div>

              {/* Output Info & Attachment */}
              <div className="flex justify-between items-center mt-1 border-t border-outline-variant/30 pt-3 ml-1">
                <div className="flex items-center gap-1.5 font-body-sm text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-outline">inventory_2</span>
                  <span>
                    {act.outputCount} {act.outputType}
                  </span>
                </div>
                {act.hasAttachment && (
                  <div className="flex flex-col items-end gap-1">
                    {act.attachments && act.attachments.length > 0 ? (
                      act.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary flex items-center gap-1 font-label-sm text-xs hover:underline no-underline"
                        >
                          <span className="material-symbols-outlined text-[16px]">link</span>
                          <span className="truncate max-w-[150px]" title={att.name}>
                            {att.name || `Bukti ${idx + 1}`}
                          </span>
                        </a>
                      ))
                    ) : (
                      <a
                        href={act.attachmentUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary flex items-center gap-1 font-label-sm text-xs hover:underline no-underline"
                      >
                        <span className="material-symbols-outlined text-[18px]">link</span>
                        <span>Bukti Dukung</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
