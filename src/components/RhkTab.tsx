import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Select, { StylesConfig } from "react-select";
import { useApp, RhkItem, Activity } from "@/context/AppContext";
import { authClient } from "@/lib/auth-client";

const periodOptions = [
  { value: "2026", label: "Tahunan 2026" },
  { value: "2025", label: "Tahunan 2025" },
  { value: "2024", label: "Tahunan 2024" },
];

const categoryOptions = [
  { value: "Semua Kategori", label: "Semua Kategori" },
  { value: "RHK Utama", label: "RHK Utama" },
  { value: "RHK Tambahan", label: "RHK Tambahan" },
];

interface OptionType {
  value: string;
  label: string;
}

const customSelectStyles: StylesConfig<OptionType, false> = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "var(--color-primary)" : "var(--color-outline-variant)",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(0, 35, 111, 0.15)" : "none",
    backgroundColor: "var(--color-surface-container-low)",
    borderRadius: "0.75rem",
    minHeight: "42px",
    fontSize: "14px",
    fontFamily: "var(--font-sans)",
    "&:hover": {
      borderColor: "var(--color-outline)"
    }
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "var(--color-surface-container-lowest)",
    borderRadius: "0.75rem",
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

interface User {
  name: string;
  nip?: string | null;
  pangkatGolongan?: string | null;
  jabatan?: string | null;
  unitKerja?: string | null;
  tandaTangan?: string | null;
}

interface RhkTabProps {
  onNotification?: (msg: string) => void;
}

export default function RhkTab({ onNotification }: RhkTabProps) {
  const router = useRouter();
  const { rhks, setRhks, setIsLoading, setLoadingMsg, confirmAction, setEditingRhk, activities } = useApp();
  const { data: session } = authClient.useSession();
  const user = session?.user as User | null;

  const [search, setSearch] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().getFullYear().toString());
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handlePeriodChange = (val: OptionType | null) => {
    const period = val ? val.value : new Date().getFullYear().toString();
    setLoadingMsg("Memfilter RHK...");
    setIsLoading(true);
    setTimeout(() => {
      setSelectedPeriod(period);
      setIsLoading(false);
    }, 300);
  };

  const handleCategoryChange = (val: OptionType | null) => {
    const category = val ? val.value : "Semua Kategori";
    setLoadingMsg("Memfilter RHK...");
    setIsLoading(true);
    setTimeout(() => {
      setSelectedCategory(category);
      setIsLoading(false);
    }, 300);
  };
  const handleEdit = (item: RhkItem) => {
    setEditingRhk(item);
    setLoadingMsg("Memuat data RHK...");
    setIsLoading(true);
    setTimeout(() => {
      router.push("/rhk/add");
    }, 350);
  };

  const handleViewLogbook = (title: string) => {
    setLoadingMsg("Memuat Logbook...");
    setIsLoading(true);
    setTimeout(() => {
      router.push(`/log?rhk=${encodeURIComponent(title)}`);
    }, 350);
  };

  const handleAddRhkNav = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoadingMsg("Memuat halaman...");
    setIsLoading(true);
    setTimeout(() => {
      router.push("/rhk/add");
    }, 350);
  };

  const handleDelete = (id: string, title: string) => {
    confirmAction({
      title: "Hapus RHK",
      message: `Apakah Anda yakin ingin menghapus RHK "${title}"? Semua kegiatan yang tertaut akan kehilangan referensi ini.`,
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/rhk?id=${id}`, {
            method: "DELETE",
          });

          if (res.ok) {
            setRhks((prev) => prev.filter((item) => item.id !== id));
            if (onNotification) {
              onNotification(`RHK "${title.substring(0, 20)}..." berhasil dihapus.`);
            }
          } else {
            const errData = await res.json();
            if (onNotification) {
              onNotification(errData.error || "Gagal menghapus RHK.");
            }
          }
        } catch (err) {
          console.error(err);
          if (onNotification) {
            onNotification("Terjadi kesalahan saat menghapus RHK.");
          }
        }
      },
    });
  };

  const handleDownloadRhkPdf = async (item: RhkItem) => {
    const rhkActivities = activities.filter(
      (act) =>
        act.category === "Tugas Rutin" &&
        act.rhk === item.title &&
        act.date.startsWith(selectedPeriod)
    );

    if (rhkActivities.length === 0) {
      if (onNotification) {
        onNotification("Tidak ada kegiatan untuk RHK ini pada periode yang dipilih.");
      } else {
        alert("Tidak ada kegiatan untuk RHK ini pada periode yang dipilih.");
      }
      return;
    }

    setLoadingMsg("Menyusun file PDF & Bukti Dukung...");
    setIsLoading(true);

    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { default: ReportPdfDocument } = await import("./ReportPdfDocument");
      const { PDFDocument } = await import("pdf-lib");

      const doc = <ReportPdfDocument activities={rhkActivities} user={user || null} />;
      const basePdfBlob = await pdf(doc).toBlob();
      const basePdfBytes = await basePdfBlob.arrayBuffer();

      const mergedPdf = await PDFDocument.load(basePdfBytes);
      
      const groups: { rhkTitle: string; activities: Activity[] }[] = [];
      rhkActivities.forEach((act) => {
        const rhkName = act.rhk || "Rencana Hasil Kerja Terkait Kinerja Organisasi";
        let group = groups.find((g) => g.rhkTitle === rhkName);
        if (!group) {
          group = { rhkTitle: rhkName, activities: [] };
          groups.push(group);
        }
        group.activities.push(act);
      });

      groups.forEach((group) => {
        group.activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });

      let currentInsertIndex = 0; 

      for (let g = 0; g < groups.length; g++) {
        const group = groups[g];
        currentInsertIndex += 1;

        for (let a = 0; a < group.activities.length; a++) {
          const act = group.activities[a];
          const pdfUrls: string[] = [];

          if (act.attachments && act.attachments.length > 0) {
            act.attachments.forEach((att) => {
              if (isPdfFile(att.name, att.url)) {
                pdfUrls.push(att.url);
              }
            });
          } else if (act.attachmentUrl && isPdfFile(act.attachmentName, act.attachmentUrl)) {
            pdfUrls.push(act.attachmentUrl);
          }

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
                mergedPdf.insertPage(currentInsertIndex + 1, page);
                currentInsertIndex++;
              });
            } catch (err) {
              console.error(`Failed to merge PDF attachment from ${pdfUrl}:`, err);
            }
          }

          currentInsertIndex += 1;
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      const mergedPdfBlob = new Blob([mergedPdfBytes as BlobPart], { type: "application/pdf" });

      const url = URL.createObjectURL(mergedPdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Laporan_RHK_${item.title.substring(0, 30).replace(/\\s+/g, "_")}_${selectedPeriod}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (onNotification) {
        onNotification(`Berhasil mengunduh PDF Laporan RHK.`);
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      if (onNotification) {
        onNotification("Gagal menyusun PDF Laporan RHK.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter RHKs
  const filteredRhks = rhks.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesPeriod = item.period === selectedPeriod;

    const matchesCategory =
      selectedCategory === "Semua Kategori" ||
      (selectedCategory === "RHK Utama" && item.type === "Utama") ||
      (selectedCategory === "RHK Tambahan" && item.type === "Tambahan");
    return matchesSearch && matchesPeriod && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-1">
            Manajemen RHK
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Kelola Rencana Hasil Kerja (Target Kinerja) Anda untuk periode ini.
          </p>
        </div>
        <button
          onClick={handleAddRhkNav}
          className="bg-primary text-on-primary font-label-md text-label-md py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-primary-container active:scale-95 transition-all cursor-pointer border-none"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            add_circle
          </span>
          Tambah RHK Baru
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-[0px_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline"
            placeholder="Cari berdasarkan judul RHK..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            instanceId="rhk-period-select"
            value={periodOptions.find((opt) => opt.value === selectedPeriod) || null}
            onChange={handlePeriodChange}
            options={periodOptions}
            styles={customSelectStyles}
            placeholder="Periode..."
            isSearchable={false}
            menuPortalTarget={isMounted ? document.body : null}
          />
          <Select
            instanceId="rhk-category-select"
            value={categoryOptions.find((opt) => opt.value === selectedCategory) || null}
            onChange={handleCategoryChange}
            options={categoryOptions}
            styles={customSelectStyles}
            placeholder="Kategori..."
            isSearchable={false}
            menuPortalTarget={isMounted ? document.body : null}
          />
        </div>
      </div>

      {/* RHK Grid */}
      <div className="flex flex-col gap-4">
        {filteredRhks.length === 0 ? (
          <div className="text-center p-8 bg-surface-container-lowest border border-outline-variant rounded-2xl">
            <span className="material-symbols-outlined text-[48px] text-outline/30 mb-2">find_in_page</span>
            <p className="text-sm text-outline">Tidak ada RHK yang sesuai filter.</p>
          </div>
        ) : (
          filteredRhks.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-[0px_2px_8px_rgba(0,0,0,0.04)] space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-label-sm font-semibold text-[10px] ${
                      item.type === "Utama"
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-secondary-container text-on-secondary-container"
                    }`}
                  >
                    {item.type}
                  </span>
                  <h3 className="font-headline-md text-sm font-bold text-on-surface leading-snug">{item.title}</h3>
                </div>
                <div className="flex gap-1">
                   <button 
                    onClick={() => handleEdit(item)}
                    className="p-2 text-on-surface-variant hover:bg-surface-variant hover:text-primary rounded-full transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-2 text-error hover:bg-error-container/10 rounded-full transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              {item.indicator && (
                <p className="text-body-sm text-xs text-on-surface-variant leading-relaxed bg-surface-container-low/40 p-2.5 rounded-lg border border-outline-variant/10">
                  <strong className="text-[10px] text-outline uppercase tracking-wider block mb-0.5">Indikator:</strong>
                  {item.indicator}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-label-sm text-xs font-semibold">
                  <span className="text-on-surface-variant">Progress Aktivitas</span>
                  <span className="text-primary">
                    {item.currentProgress} / {item.targetProgress}
                  </span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${(item.currentProgress / item.targetProgress) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                 <button 
                  onClick={() => handleViewLogbook(item.title)}
                  className="flex-1 py-2 border border-primary text-primary font-label-md text-xs font-bold rounded-lg hover:bg-primary-container/10 transition-colors cursor-pointer bg-transparent"
                >
                  Lihat Logbook
                </button>
                <button
                  onClick={() => handleDownloadRhkPdf(item)}
                  className="flex-1 py-2 border border-outline text-on-surface-variant font-label-md text-xs font-bold rounded-lg hover:bg-surface-variant transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-transparent"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download
                </button>
              </div>
            </div>
          ))
        )}
      </div>    </div>
  );
}
