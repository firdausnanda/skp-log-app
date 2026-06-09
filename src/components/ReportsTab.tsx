"use client";

import React, { useState, useEffect, useMemo } from "react";
import Select, { StylesConfig } from "react-select";
import { useApp, Activity } from "@/context/AppContext";

interface OptionType {
  value: string;
  label: string;
}
import { authClient } from "@/lib/auth-client";

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

const INDO_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const INDO_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const INDO_MONTH_MAP: Record<string, number> = {
  "Januari": 1, "Februari": 2, "Maret": 3, "April": 4, "Mei": 5, "Juni": 6,
  "Juli": 7, "Agustus": 8, "September": 9, "Oktober": 10, "November": 11, "Desember": 12
};

const getAbsoluteUrl = (url: string) => {
  if (!url) return "";
  
  const matchD = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const matchId = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  const fileId = (matchD && matchD[1]) || (matchId && matchId[1]);
  
  if (fileId) {
    url = `/api/drive-file?id=${fileId}`;
  }

  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  
  if (typeof window !== "undefined") {
    return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
  }
  return url;
};

const isPdfFile = (fileName?: string, url?: string) => {
  const nameToCheck = (fileName || url || "").toLowerCase();
  return nameToCheck.split("?")[0].endsWith(".pdf");
};

const BERAKHLAK_ASPECTS = [
  "Berorientasi Pelayanan",
  "Akuntabel",
  "Kompeten",
  "Harmonis",
  "Loyal",
  "Adaptif",
  "Kolaboratif"
];

const getActivityAspect = (act: Activity) => {
  const match = act.title.match(/^\[([^\]]+)\]/);
  return match ? match[1] : "";
};

const formatActivityDate = (dateStr: string) => {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    return `${day} ${INDO_MONTHS[monthIndex]} ${year}`;
  }
  return dateStr;
};

const getIndoDay = (dateStr: string) => {
  const d = new Date(dateStr);
  return INDO_DAYS[d.getDay()];
};

const customSelectStyles: StylesConfig<OptionType, false> = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "var(--color-primary)" : "var(--color-outline-variant)",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(0, 35, 111, 0.15)" : "none",
    backgroundColor: "var(--color-surface-container-lowest)",
    borderRadius: "0.5rem",
    minHeight: "44px",
    fontSize: "14px",
    fontFamily: "var(--font-sans)",
    "&:hover": {
      borderColor: "var(--color-outline)"
    }
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "var(--color-surface-container-lowest)",
    borderRadius: "0.5rem",
    border: "1px solid var(--color-outline-variant)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
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
    fontSize: "14px",
    cursor: "pointer",
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

export default function ReportsTab() {
  const { activities, rhks, triggerNotification, showLoading } = useApp();
  const { data: session } = authClient.useSession();
  const user = session?.user as UserWithCustomFields | undefined;

  const [year, setYear] = useState(() => {
    const now = new Date();
    return now.getFullYear().toString();
  });
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return INDO_MONTHS[now.getMonth()];
  });

  const [rhk, setRhk] = useState("Semua RHK");

  const [isFiltering, setIsFiltering] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isBerakhlakPdfLoading, setIsBerakhlakPdfLoading] = useState(false);
  const [downloadingAspect, setDownloadingAspect] = useState<string | null>(null);
  const [reportType, setReportType] = useState<"tugas_rutin" | "berakhlak">("tugas_rutin");

  // Static month options
  const monthOptions = INDO_MONTHS.map((m) => ({
    value: m,
    label: m,
  }));

  // Client-side rendering portal check
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Generate dynamic year options using useMemo
  const yearOptions = useMemo(() => {
    const yearsSet = new Set<string>();
    const now = new Date();
    const currentYear = now.getFullYear();

    // Always include current year, last year, and next year
    yearsSet.add(currentYear.toString());
    yearsSet.add((currentYear - 1).toString());
    yearsSet.add((currentYear + 1).toString());

    // Add any years from activities
    activities.forEach((act) => {
      const parts = act.date.split("-");
      if (parts.length === 3) {
        yearsSet.add(parts[0]);
      }
    });

    // Add any years from RHKs
    rhks.forEach((r) => {
      if (r.period) {
        yearsSet.add(r.period);
      }
    });

    // Sort descending
    const sortedYears = Array.from(yearsSet).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    return sortedYears.map((y) => ({ value: y, label: y }));
  }, [activities, rhks]);

  // Generate dynamic RHK options based on the selected year using useMemo
  const rhkOptions = useMemo(() => {
    if (!year) return [{ value: "Semua RHK", label: "Semua RHK" }];
    
    // Only show RHKs belonging to the selected year
    const filteredRhks = rhks.filter((r) => r.period === year);
    
    return [
      { value: "Semua RHK", label: "Semua RHK" },
      ...filteredRhks.map((item, index) => ({
        value: item.title,
        label: `RHK #${index + 1}: ${item.title}`,
      })),
    ];
  }, [year, rhks]);

  // Adjust rhk selection if it becomes invalid after year or rhks change
  const [prevYear, setPrevYear] = useState(year);
  const [prevRhks, setPrevRhks] = useState(rhks);
  if (year !== prevYear || rhks !== prevRhks) {
    setPrevYear(year);
    setPrevRhks(rhks);
    if (!rhkOptions.some((opt) => opt.value === rhk)) {
      setRhk("Semua RHK");
    }
  }

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    // Filter by report type category
    const targetCategory = reportType === "tugas_rutin" ? "Tugas Rutin" : "BerAKHLAK";
    if (act.category !== targetCategory) return false;

    // Year & Month filter
    if (year && month) {
      const monthNum = INDO_MONTH_MAP[month];
      const prefix = `${year}-${String(monthNum).padStart(2, "0")}`;
      if (!act.date.startsWith(prefix)) return false;
    }

    // RHK filter (only applies to Tugas Rutin)
    if (reportType === "tugas_rutin" && rhk !== "Semua RHK") {
      if (act.rhk !== rhk) return false;
    }

    return true;
  });

  const handleApplyFilters = async () => {
    setIsFiltering(true);
    await showLoading("Menyaring data...", 600);
    setIsFiltering(false);
    if (reportType === "tugas_rutin") {
      triggerNotification(`Filter diterapkan: ${month} ${year} • ${rhk}`);
    } else {
      triggerNotification(`Filter diterapkan: ${month} ${year} • BerAKHLAK`);
    }
  };

  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    await showLoading("Menyusun file PDF & Bukti Dukung...", 1500);
    try {
      // Dynamically import libraries to bypass SSR errors
      const { pdf } = await import("@react-pdf/renderer");
      const { default: ReportPdfDocument } = await import("./ReportPdfDocument");
      const { PDFDocument } = await import("pdf-lib");

      // 1. Generate the base PDF using @react-pdf/renderer
      const doc = <ReportPdfDocument activities={filteredActivities} user={user || null} />;
      const basePdfBlob = await pdf(doc).toBlob();
      const basePdfBytes = await basePdfBlob.arrayBuffer();

      // 2. Load the base PDF into pdf-lib
      const mergedPdf = await PDFDocument.load(basePdfBytes);
      
      // Group the activities by RHK to accurately map page offsets
      const groups: { rhkTitle: string; activities: Activity[] }[] = [];
      filteredActivities.forEach((act) => {
        const rhkName = act.rhk || "Rencana Hasil Kerja Terkait Kinerja Organisasi";
        let group = groups.find((g) => g.rhkTitle === rhkName);
        if (!group) {
          group = { rhkTitle: rhkName, activities: [] };
          groups.push(group);
        }
        group.activities.push(act);
      });

      // Sort activities in each RHK group chronologically (oldest first / ascending)
      groups.forEach((group) => {
        group.activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });

      // Track page insertions dynamically. 
      // For each RHK group, page index 0 is the Cover. 
      // The first activity page starts at index 1.
      let currentInsertIndex = 0; 

      for (let g = 0; g < groups.length; g++) {
        const group = groups[g];
        currentInsertIndex += 1; // Skip the group's cover page

        for (let a = 0; a < group.activities.length; a++) {
          const act = group.activities[a];
          const pdfUrls: string[] = [];

          // Check for PDF attachments
          if (act.attachments && act.attachments.length > 0) {
            act.attachments.forEach((att) => {
              if (isPdfFile(att.name, att.url)) {
                pdfUrls.push(att.url);
              }
            });
          } else if (act.attachmentUrl && isPdfFile(act.attachmentName, act.attachmentUrl)) {
            pdfUrls.push(act.attachmentUrl);
          }

          // Fetch and append PDF pages
          for (const pdfUrl of pdfUrls) {
            try {
              const absoluteUrl = getAbsoluteUrl(pdfUrl);
              const res = await fetch(absoluteUrl);
              if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
              
              const attachmentPdfBytes = await res.arrayBuffer();
              const attachmentPdf = await PDFDocument.load(attachmentPdfBytes);
              
              const copiedPages = await mergedPdf.copyPages(
                attachmentPdf,
                attachmentPdf.getPageIndices()
              );

              copiedPages.forEach((page) => {
                // Insert page immediately after current activity page
                mergedPdf.insertPage(currentInsertIndex + 1, page);
                currentInsertIndex++;
              });
            } catch (err) {
              console.error(`Failed to merge PDF attachment from ${pdfUrl}:`, err);
            }
          }

          // Move index to point to the next activity page
          currentInsertIndex += 1;
        }
      }

      // 3. Save the final merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      const mergedPdfBlob = new Blob([mergedPdfBytes as BlobPart], { type: "application/pdf" });

      // 4. Download the merged PDF
      const url = URL.createObjectURL(mergedPdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Laporan_Kinerja_${month}_${year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      triggerNotification(`Berhasil mengunduh PDF Laporan Kinerja (${month} ${year})`);
    } catch (error) {
      console.error("PDF generation/merge failed:", error);
      triggerNotification("Gagal menyusun PDF Laporan Kinerja.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleDownloadBerakhlakPdf = async (aspect: string, aspectActivities: Activity[]) => {
    setDownloadingAspect(aspect);
    await showLoading(`Menyusun PDF BerAKHLAK - ${aspect}...`, 1500);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { default: ReportBerakhlakPdfDocument } = await import("./ReportBerakhlakPdfDocument");
      const { PDFDocument } = await import("pdf-lib");

      // 1. Generate base PDF using our new ReportBerakhlakPdfDocument component
      const doc = <ReportBerakhlakPdfDocument activities={aspectActivities} aspect={aspect} user={user || null} />;
      const basePdfBlob = await pdf(doc).toBlob();
      const basePdfBytes = await basePdfBlob.arrayBuffer();

      // 2. Load the base PDF into pdf-lib
      const mergedPdf = await PDFDocument.load(basePdfBytes);

      // Sort activities chronologically (ascending) to match the document layout
      const sortedActivities = [...aspectActivities].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Track page insertions dynamically.
      // Page 0 is Cover. Page 1 is the first activity.
      let currentInsertIndex = 1;
      
      for (let a = 0; a < sortedActivities.length; a++) {
        const act = sortedActivities[a];
        const pdfUrls: string[] = [];

        // Check for PDF attachments
        if (act.attachments && act.attachments.length > 0) {
          act.attachments.forEach((att) => {
            if (isPdfFile(att.name, att.url)) {
              pdfUrls.push(att.url);
            }
          });
        } else if (act.attachmentUrl && isPdfFile(act.attachmentName, act.attachmentUrl)) {
          pdfUrls.push(act.attachmentUrl);
        }

        // Fetch and append PDF pages
        for (const pdfUrl of pdfUrls) {
          try {
            const absoluteUrl = getAbsoluteUrl(pdfUrl);
            const res = await fetch(absoluteUrl);
            if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
            
            const attachmentPdfBytes = await res.arrayBuffer();
            const attachmentPdf = await PDFDocument.load(attachmentPdfBytes);
            
            const copiedPages = await mergedPdf.copyPages(
              attachmentPdf,
              attachmentPdf.getPageIndices()
            );

            copiedPages.forEach((page) => {
              // Insert page immediately after current activity page
              mergedPdf.insertPage(currentInsertIndex + 1, page);
              currentInsertIndex++;
            });
          } catch (err) {
            console.error(`Failed to merge PDF attachment from ${pdfUrl}:`, err);
          }
        }

        // Move index to point to the next activity page
        currentInsertIndex += 2;
      }

      // 3. Save the final merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      const mergedPdfBlob = new Blob([mergedPdfBytes as BlobPart], { type: "application/pdf" });

      // 4. Download the merged PDF
      const url = URL.createObjectURL(mergedPdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Laporan_BerAKHLAK_${aspect.replace(/\s+/g, "_")}_${month}_${year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      triggerNotification(`Berhasil mengunduh PDF BerAKHLAK: ${aspect} (${month} ${year})`);
    } catch (error) {
      console.error("Berakhlak PDF export failed:", error);
      triggerNotification(`Gagal menyusun PDF BerAKHLAK untuk aspek ${aspect}.`);
    } finally {
      setDownloadingAspect(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-1">
          Laporan & Ekspor
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Lihat pratinjau dan ekspor laporan capaian sasaran kinerja pegawai.
        </p>
      </div>

      {/* Report Type Selector (Tabs) */}
      <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-1 flex w-full">
        <button
          onClick={() => setReportType("tugas_rutin")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 border-none cursor-pointer ${
            reportType === "tugas_rutin"
              ? "bg-primary text-on-primary shadow-sm"
              : "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">task_alt</span>
          Tugas Rutin
        </button>
        <button
          onClick={() => setReportType("berakhlak")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 border-none cursor-pointer ${
            reportType === "berakhlak"
              ? "bg-primary text-on-primary shadow-sm"
              : "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">diversity_3</span>
          BerAKHLAK
        </button>
      </div>

      {/* Filter Section */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] flex flex-col gap-4">
        <h2 className="font-label-md text-label-md text-on-surface font-semibold">
          Filter Laporan
        </h2>
        
        <div className="flex flex-col gap-3">
          {/* Year and Month Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Year Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Tahun
              </label>
              <Select
                instanceId="reports-year-select"
                value={yearOptions.find((opt) => opt.value === year) || null}
                onChange={(val) => setYear(val ? val.value : "")}
                options={yearOptions}
                styles={customSelectStyles}
                placeholder="Pilih Tahun..."
                isSearchable={false}
                menuPortalTarget={isMounted ? document.body : null}
              />
            </div>

            {/* Month Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Bulan
              </label>
              <Select
                instanceId="reports-month-select"
                value={monthOptions.find((opt) => opt.value === month) || null}
                onChange={(val) => setMonth(val ? val.value : "")}
                options={monthOptions}
                styles={customSelectStyles}
                placeholder="Pilih Bulan..."
                isSearchable={false}
                menuPortalTarget={isMounted ? document.body : null}
              />
            </div>
          </div>

          {/* RHK Dropdown */}
          {reportType === "tugas_rutin" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Rencana Hasil Kerja (RHK)
              </label>
              <Select
                instanceId="reports-rhk-select"
                value={rhkOptions.find((opt) => opt.value === rhk) || null}
                onChange={(val) => setRhk(val ? val.value : "Semua RHK")}
                options={rhkOptions}
                styles={customSelectStyles}
                placeholder="Pilih RHK..."
                isSearchable={true}
                menuPortalTarget={isMounted ? document.body : null}
              />
            </div>
          )}
        </div>

        <button
          onClick={handleApplyFilters}
          disabled={isFiltering || isPdfLoading}
          className="w-full h-10 bg-surface-variant hover:bg-outline-variant/20 active:scale-[0.98] text-on-surface-variant rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer border-none disabled:opacity-60"
        >
          {isFiltering ? (
            <div className="w-4 h-4 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin shrink-0"></div>
          ) : (
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
          )}
          Terapkan Filter
        </button>
      </section>

      {/* Live Preview Section */}
      {reportType === "tugas_rutin" && (
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[22px]">visibility</span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Pratinjau Laporan ({filteredActivities.length})
            </h2>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">
            Berikut adalah daftar kegiatan yang masuk dalam laporan dengan filter terpilih.
          </p>

          <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1">
            {filteredActivities.length === 0 ? (
              <div className="text-center p-6 bg-surface border border-outline-variant rounded-xl">
                <span className="material-symbols-outlined text-[36px] text-outline/30 mb-1">find_in_page</span>
                <p className="text-xs text-outline">Tidak ada kegiatan yang sesuai.</p>
              </div>
            ) : (
              filteredActivities.map((act, idx) => (
                <div
                  key={act.id || idx}
                  className="bg-surface p-3 rounded-lg border border-outline-variant/50 flex flex-col gap-2 relative overflow-hidden"
                >
                  {/* Accent indicator bar on the left */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  
                  <div className="flex justify-between items-center pl-1">
                    <span className="text-[10px] font-bold text-on-surface-variant">
                      {getIndoDay(act.date)}, {formatActivityDate(act.date)}
                    </span>
                    <span className="text-[10px] bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded font-medium">
                      {act.outputCount} {act.outputType}
                    </span>
                  </div>

                  <h4 className="font-body-md text-xs text-on-surface font-semibold line-clamp-2 pl-1 leading-snug">
                    {act.title}
                  </h4>

                  <div className="bg-surface-container-low p-2 rounded text-[10px] text-on-surface-variant pl-1 leading-snug">
                    <span className="font-bold text-[9px] uppercase tracking-wider block mb-0.5 text-outline">
                      {reportType === "tugas_rutin" ? "RHK Terkait:" : "Aspek BerAKHLAK / RHK:"}
                    </span>
                    {act.rhk || "-"}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Ekspor Data Section */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-primary">download</span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
            Ekspor Laporan
          </h2>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">
          Unduh laporan kinerja Anda berdasarkan filter yang dipilih di atas.
        </p>
        
        <div className="flex flex-col gap-3">
          {reportType === "tugas_rutin" ? (
            <button
              onClick={handleDownloadPdf}
              disabled={isFiltering || isPdfLoading}
              className="w-full h-12 bg-primary hover:bg-primary-container active:scale-[0.98] text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer border-none disabled:opacity-60"
            >
              {isPdfLoading ? (
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin shrink-0"></div>
              ) : (
                <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
              )}
              Unduh PDF
            </button>
          ) : (
            <div className="flex flex-col gap-2.5">
              {BERAKHLAK_ASPECTS.map((aspect) => {
                const aspectActivities = filteredActivities.filter(
                  (act) => getActivityAspect(act) === aspect
                );
                const count = aspectActivities.length;
                const isDownloading = downloadingAspect === aspect;

                return (
                  <button
                    key={aspect}
                    onClick={() => handleDownloadBerakhlakPdf(aspect, aspectActivities)}
                    disabled={isFiltering || count === 0 || downloadingAspect !== null}
                    className="w-full h-12 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/60 active:scale-[0.98] text-on-surface rounded-lg font-label-md text-xs font-semibold flex items-center justify-between px-4 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        diversity_3
                      </span>
                      <span>{aspect}</span>
                      <span className="bg-secondary-container text-on-secondary-container text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {count} Jurnal
                      </span>
                    </div>
                    {isDownloading ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        download
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
