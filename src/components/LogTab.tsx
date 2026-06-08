"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, Activity } from "@/context/AppContext";

export default function LogTab() {
  const router = useRouter();
  const {
    activities,
    setActivities,
    setActivityCategoryPreset,
    setEditingActivity,
    triggerNotification,
    showLoading,
    setIsLoading,
    setLoadingMsg,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // "all", "today", "yesterday"
  const [rhkFilter, setRhkFilter] = useState("all"); // "all", or RHK title

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

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kegiatan ini?")) {
      await showLoading("Menghapus kegiatan...", 800);
      setActivities((prev) => prev.filter((act) => act.id !== id));
      triggerNotification("Kegiatan berhasil dihapus.");
    }
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
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dateStr === today) return "Hari Ini";
    if (dateStr === yesterday) return "Kemarin";
    
    // Format: YYYY-MM-DD -> DD MMM YYYY
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
      const day = parseInt(parts[2]);
      const monthIndex = parseInt(parts[1]) - 1;
      const year = parts[0];
      return `${day} ${months[monthIndex]} ${year}`;
    }
    return dateStr;
  };

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.rhk.toLowerCase().includes(searchQuery.toLowerCase());

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    let matchesDate = true;
    if (dateFilter === "today") {
      matchesDate = act.date === today;
    } else if (dateFilter === "yesterday") {
      matchesDate = act.date === yesterday;
    }

    const matchesRhk = rhkFilter === "all" || act.rhk === rhkFilter;

    return matchesSearch && matchesDate && matchesRhk;
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-body-sm text-body-sm text-on-surface placeholder:text-outline transition-shadow"
            placeholder="Cari kegiatan..."
          />
        </div>

        {/* Horizontal scrollable selectors */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {/* Date Filter Dropdown Button */}
          <div className="relative flex items-center flex-shrink-0">
            <span className="material-symbols-outlined absolute left-2.5 pointer-events-none text-[18px] text-on-surface-variant">
              calendar_today
            </span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-8 pr-7 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-variant appearance-none cursor-pointer focus:outline-none"
            >
              <option value="all">Semua Tanggal</option>
              <option value="today">Hari Ini</option>
              <option value="yesterday">Kemarin</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 pointer-events-none text-[16px] text-on-surface-variant">
              arrow_drop_down
            </span>
          </div>

          {/* RHK Filter Dropdown Button */}
          <div className="relative flex items-center flex-shrink-0">
            <span className="material-symbols-outlined absolute left-2.5 pointer-events-none text-[18px] text-on-surface-variant">
              filter_list
            </span>
            <select
              value={rhkFilter}
              onChange={(e) => setRhkFilter(e.target.value)}
              className="pl-8 pr-7 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-variant appearance-none cursor-pointer focus:outline-none max-w-[160px] truncate"
            >
              <option value="all">Semua RHK</option>
              <option value="RHK #1: Penyusunan Rencana Strategis Tahunan">RHK #1</option>
              <option value="RHK #2: Koordinasi Lintas Sektoral Kinerja Daerah">RHK #2</option>
              <option value="RHK #3: Pengelolaan Pengarsipan Berkas Digital">RHK #3</option>
              <option value="RHK #4: Evaluasi Mingguan Kepatuhan Administrasi">RHK #4</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 pointer-events-none text-[16px] text-on-surface-variant">
              arrow_drop_down
            </span>
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
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  act.category === "BerAKHLAK"
                    ? "bg-[#D1FAE5] text-[#065F46]"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}>
                  {act.category}
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
                    onClick={() => handleDelete(act.id)}
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
                <span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
                <span>
                  {formatActivityDate(act.date)}{act.timeStart && act.timeEnd ? `, ${act.timeStart} - ${act.timeEnd}` : ""}
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
                  <button
                    onClick={() => triggerNotification(`Membuka berkas: ${act.attachmentName}`)}
                    className="text-primary flex items-center gap-1 font-label-sm text-xs hover:underline cursor-pointer border-none bg-transparent"
                  >
                    <span className="material-symbols-outlined text-[18px]">link</span>
                    <span>Bukti Dukung</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
