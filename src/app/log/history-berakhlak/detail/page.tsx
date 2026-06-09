"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, Activity } from "@/context/AppContext";

const coreValuesList = [
  { name: "Berorientasi Pelayanan", icon: "support_agent", descriptionPlaceholder: "Merespon cepat keluhan pelayanan dan memberikan solusi." },
  { name: "Akuntabel", icon: "account_balance_wallet", descriptionPlaceholder: "Melaksanakan tugas dengan jujur, bertanggung jawab, dan disiplin." },
  { name: "Kompeten", icon: "school", descriptionPlaceholder: "Meningkatkan kompetensi diri untuk menjawab tantangan yang selalu berubah." },
  { name: "Harmonis", icon: "diversity_3", descriptionPlaceholder: "Menghargai setiap orang apapun latar belakangnya." },
  { name: "Loyal", icon: "favorite", descriptionPlaceholder: "Memegang teguh ideologi Pancasila dan menjaga nama baik ASN." },
  { name: "Adaptif", icon: "sync_alt", descriptionPlaceholder: "Cepat menyesuaikan diri menghadapi perubahan dan terus berinovasi." },
  { name: "Kolaboratif", icon: "handshake", descriptionPlaceholder: "Memberi kesempatan kepada berbagai pihak untuk berkontribusi." }
];

const monthMap: { [key: string]: number } = {
  "Januari": 0, "Februari": 1, "Maret": 2, "April": 3, "Mei": 4, "Juni": 5,
  "Juli": 6, "Agustus": 7, "September": 8, "Oktober": 9, "November": 10, "Desember": 11
};

function DetailJurnalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    activities,
    setActivities,
    setEditingActivity,
    setActivityCategoryPreset,
    triggerNotification,
    setIsLoading,
    setLoadingMsg,
    confirmAction,
    showLoading
  } = useApp();
  
  const monthParam = searchParams.get("month") || "Juni 2026";
  const [monthName, yearStr] = monthParam.split(" ");
  const year = parseInt(yearStr) || 2026;
  const monthIndex = monthMap[monthName] !== undefined ? monthMap[monthName] : 5;

  const [expandedVal, setExpandedVal] = useState<string | null>(null);

  // Heuristic parser to detect which Core Value the activity represents
  const getCoreValueFromTitle = (title: string): string | null => {
    for (const val of coreValuesList) {
      if (title.startsWith(`[${val.name}] `)) {
        return val.name;
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

  const getRawDescription = (title: string, coreValue: string): string => {
    if (title.startsWith(`[${coreValue}] `)) {
      return title.substring(`[${coreValue}] `.length);
    }
    return title;
  };

  // Find actual context activities in this month & year
  const actualMonthActivities = activities.filter(act => {
    if (act.category !== "BerAKHLAK") return false;
    const actDate = new Date(act.date);
    return actDate.getFullYear() === year && actDate.getMonth() === monthIndex;
  });

  // Use actual activities from database
  const currentMonthActivities = [...actualMonthActivities];

  // Map each value to its corresponding activities (multiple support)
  const valueEntries = coreValuesList.map(v => {
    const matchingActivities = currentMonthActivities.filter(act => getCoreValueFromTitle(act.title) === v.name);
    return {
      value: v.name,
      icon: v.icon,
      activities: matchingActivities
    };
  });

  const filledCount = valueEntries.filter(item => item.activities.length > 0).length;
  const isComplete = filledCount === 7;
  const percent = Math.round((filledCount / 7) * 100);

  const handleBack = () => {
    setLoadingMsg("Kembali...");
    setIsLoading(true);
    setTimeout(() => {
      router.push("/log/history-berakhlak");
    }, 350);
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setLoadingMsg("Memuat data...");
    setIsLoading(true);
    const coreVal = getCoreValueFromTitle(activity.title) || "";
    setTimeout(() => {
      router.push(`/log/add-berakhlak?value=${encodeURIComponent(coreVal)}`);
    }, 350);
  };

  const handleDelete = (id: string, title: string) => {
    confirmAction({
      title: "Hapus Jurnal",
      message: `Apakah Anda yakin ingin menghapus entri jurnal "${title}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      isDanger: true,
      onConfirm: async () => {
        await showLoading("Menghapus entri...", 800);
        try {
          const res = await fetch(`/api/activity?id=${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            setActivities((prev) => prev.filter((act) => act.id !== id));
            triggerNotification("Entri jurnal berhasil dihapus.");
          } else {
            const err = await res.json();
            alert(`Gagal menghapus entri: ${err.error}`);
          }
        } catch (error) {
          console.error(error);
          alert("Gagal menghapus entri karena gangguan koneksi.");
        }
      },
    });
  };

  const handleCreateForValue = (valueName: string) => {
    setEditingActivity(null);
    setActivityCategoryPreset("BerAKHLAK");
    setLoadingMsg("Memuat halaman...");
    setIsLoading(true);
    setTimeout(() => {
      router.push(`/log/add-berakhlak?value=${encodeURIComponent(valueName)}`);
    }, 350);
  };

  return (
    <div className="w-full flex flex-col gap-6">
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
        <span className="font-headline-md text-headline-md text-primary font-bold">Riwayat Jurnal</span>
      </div>

      {/* Header Month & Year */}
      <section className="flex items-center gap-3.5 bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/50">
        <div className="bg-primary-container p-3 rounded-lg text-on-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            calendar_month
          </span>
        </div>
        <div>
          <h2 className="font-headline-lg-mobile text-xl text-on-surface font-bold">{monthParam}</h2>
          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">Periode Pelaporan Aktif</p>
        </div>
      </section>

      {/* Progress Summary Card */}
      <section className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/50 flex flex-col gap-3.5">
        <div className="flex justify-between items-center">
          <h3 className="font-label-md text-sm text-on-surface font-bold">Penyelesaian Nilai</h3>
          <span className={`font-label-sm text-xs px-2.5 py-0.5 rounded-full font-bold ${
            isComplete
              ? "bg-[#D1FAE5] text-[#065F46]"
              : "bg-error-container text-on-error-container"
          }`}>
            {filledCount}/7 {isComplete ? "Selesai" : "Belum Lengkap"}
          </span>
        </div>
        <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden relative">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${isComplete ? "bg-secondary" : "bg-error"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="font-body-sm text-[11px] text-on-surface-variant text-right italic font-medium">
          {isComplete ? "Target tercapai untuk bulan ini" : "Silakan lengkapi nilai yang belum diisi"}
        </p>
      </section>

      {/* Value Breakdown List */}
      <section className="flex flex-col gap-4">
        <h3 className="font-label-md text-sm text-on-surface font-bold px-1">Rincian Perilaku</h3>
        
        <div className="flex flex-col gap-3">
          {valueEntries.map((item) => {
            const hasEntry = item.activities.length > 0;
            const isExpanded = expandedVal === item.value;

            return (
              <article
                key={item.value}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-sm overflow-hidden flex flex-col transition-all duration-200"
              >
                {/* Header Row */}
                <div className="p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      hasEntry ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-outline"
                    }`}>
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-label-sm text-xs text-on-surface font-bold truncate">{item.value}</h4>
                      <p className="text-[10px] text-outline mt-0.5">
                        {hasEntry 
                          ? `${item.activities.length} Laporan Diisi` 
                          : "Belum Diisi"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasEntry ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCreateForValue(item.value)}
                          className="px-2.5 py-1.5 rounded-lg text-primary font-label-sm text-[11px] font-bold hover:bg-primary/10 transition-colors cursor-pointer border-none flex items-center gap-1 bg-transparent"
                          title="Tambah Laporan Baru"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                          <span>Tambah</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedVal(isExpanded ? null : item.value)}
                          className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-label-sm text-[11px] font-bold hover:opacity-90 transition-opacity cursor-pointer border-none"
                        >
                          {isExpanded ? "Tutup" : "Detail"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCreateForValue(item.value)}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant font-label-sm text-[11px] font-bold hover:bg-surface-variant transition-colors cursor-pointer border-none"
                      >
                        Isi Jurnal
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Details */}
                {hasEntry && isExpanded && (
                  <div className="px-3.5 pb-4 pt-1 border-t border-outline-variant/20 bg-surface-container-low/20 flex flex-col gap-4">
                    {item.activities.map((act, index) => (
                      <div key={act.id} className={`flex flex-col gap-3 ${index > 0 ? "border-t border-outline-variant/25 pt-4" : ""}`}>
                        <div className="flex justify-between items-center bg-surface-container-low/40 p-2 rounded-lg">
                          <span className="text-[11px] font-bold text-primary">Laporan #{index + 1}</span>
                          <span className="text-[11px] text-on-surface-variant font-bold bg-surface-container px-2 py-0.5 rounded-md">
                            {new Date(act.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-outline font-bold uppercase tracking-wider">
                            Tindakan Perilaku ASN
                          </span>
                          <p className="text-xs text-on-surface leading-relaxed font-medium bg-surface-bright p-3 rounded-lg border border-outline-variant/30">
                            {getRawDescription(act.title, item.value)}
                          </p>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-outline font-bold uppercase tracking-wider">
                            Sasaran Hasil Kerja (RHK)
                          </span>
                          <p className="text-xs text-on-surface font-semibold truncate">
                            {act.rhk}
                          </p>
                        </div>

                        {act.attachments && act.attachments.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] text-outline font-bold uppercase tracking-wider">
                              Bukti Dukung ({act.attachments.length})
                            </span>
                            <div className="space-y-1.5">
                              {act.attachments.map((att, idx) => (
                                <a
                                  key={idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 bg-surface-bright border border-outline-variant/30 rounded-lg max-w-full hover:bg-surface-container transition-colors cursor-pointer text-inherit no-underline"
                                >
                                  <span className="material-symbols-outlined text-primary text-base">
                                    {att.name.endsWith(".jpg") || att.name.endsWith(".png") ? "image" : "description"}
                                  </span>
                                  <span className="text-[11px] text-on-surface font-medium truncate flex-grow">
                                    {att.name}
                                  </span>
                                  <span className="material-symbols-outlined text-outline text-sm">open_in_new</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : act.attachmentName ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-outline font-bold uppercase tracking-wider">
                              Bukti Dukung
                            </span>
                            <a
                              href={act.attachmentUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-surface-bright border border-outline-variant/30 rounded-lg max-w-full hover:bg-surface-container transition-colors cursor-pointer text-inherit no-underline"
                            >
                              <span className="material-symbols-outlined text-primary text-base">
                                {act.attachmentName.endsWith(".jpg") || act.attachmentName.endsWith(".png") ? "image" : "description"}
                              </span>
                              <span className="text-[11px] text-on-surface font-medium truncate flex-grow">
                                {act.attachmentName}
                              </span>
                              <span className="material-symbols-outlined text-outline text-sm">open_in_new</span>
                            </a>
                          </div>
                        ) : null}

                        <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/10 mt-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(act.id, act.title)}
                            className="px-3 py-1.5 rounded-lg bg-error-container text-on-error-container font-label-md text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer border-none"
                          >
                            Hapus Laporan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (act.id.startsWith("mock-act")) {
                                triggerNotification("Data historis simulasi tidak dapat diubah.");
                              } else {
                                handleEdit(act);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-xs font-bold hover:bg-primary-container active:scale-[0.98] transition-all cursor-pointer border-none"
                          >
                            Edit Laporan
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-3 border-t border-outline-variant/20 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleCreateForValue(item.value)}
                        className="w-full py-2.5 rounded-lg border border-dashed border-primary/40 text-primary font-label-md text-xs font-bold hover:bg-primary/5 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-transparent"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                        Tambah Laporan {item.value} Baru
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function DetailJurnalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-outline">Memuat detail jurnal...</div>}>
      <DetailJurnalContent />
    </Suspense>
  );
}
