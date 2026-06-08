"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, Activity } from "@/context/AppContext";
import DatePicker from "@/components/DatePicker";

const coreValues = [
  { name: "Berorientasi Pelayanan", icon: "volunteer_activism" },
  { name: "Akuntabel", icon: "verified_user" },
  { name: "Kompeten", icon: "military_tech" },
  { name: "Harmonis", icon: "diversity_3" },
  { name: "Loyal", icon: "favorite" },
  { name: "Adaptif", icon: "sync_alt" },
  { name: "Kolaboratif", icon: "handshake" },
];

export default function AddBerakhlakPage() {
  const router = useRouter();
  const {
    rhks,
    setActivities,
    editingActivity,
    setEditingActivity,
    setActivityCategoryPreset,
    triggerNotification,
    showLoading,
    setIsLoading,
    setLoadingMsg,
  } = useApp();

  const [activeValue, setActiveValue] = useState(() => {
    if (editingActivity && editingActivity.category === "BerAKHLAK") {
      const rawTitle = editingActivity.title;
      for (const val of coreValues) {
        if (rawTitle.startsWith(`[${val.name}] `)) {
          return val.name;
        }
      }
    }
    return "Berorientasi Pelayanan";
  });

  const [date, setDate] = useState(() => {
    if (editingActivity && editingActivity.category === "BerAKHLAK") {
      return editingActivity.date;
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [description, setDescription] = useState(() => {
    if (editingActivity && editingActivity.category === "BerAKHLAK") {
      const rawTitle = editingActivity.title;
      for (const val of coreValues) {
        if (rawTitle.startsWith(`[${val.name}] `)) {
          return rawTitle.substring(`[${val.name}] `.length);
        }
      }
      return rawTitle;
    }
    return "";
  });

  const [evidenceFiles, setEvidenceFiles] = useState<string[]>(() => {
    if (editingActivity && editingActivity.category === "BerAKHLAK" && editingActivity.attachmentName) {
      return [editingActivity.attachmentName];
    }
    return [];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = () => {
    setEditingActivity(null);
    setActivityCategoryPreset(null);
    setLoadingMsg("Kembali...");
    setIsLoading(true);
    setTimeout(() => {
      router.push("/log");
    }, 350);
  };

  const handleUploadFile = () => {
    const randomSuffix = Math.random().toString(36).substring(5);
    const mockFileName = `dokumen_berakhlak_${randomSuffix}.pdf`;
    setEvidenceFiles((prev) => [...prev, mockFileName]);
    triggerNotification("File berhasil diunggah.");
  };

  const handleCameraCapture = () => {
    const randomSuffix = Math.random().toString(36).substring(5);
    const mockFileName = `foto_berakhlak_${randomSuffix}.jpg`;
    setEvidenceFiles((prev) => [...prev, mockFileName]);
    triggerNotification("Foto berhasil ditangkap.");
  };

  const handleRemoveFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, idx) => idx !== index));
    triggerNotification("Bukti dukung dihapus.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Deskripsi perilaku tidak boleh kosong!");
      return;
    }

    // Default RHK for BerAKHLAK: use the editing activity's RHK or the first RHK in the list or a generic one
    const rhkToLink = editingActivity?.rhk || rhks[0]?.title || "Rencana Hasil Kerja Terkait Kinerja Organisasi";

    // Prepend Core Value prefix to title
    const fullTitle = `[${activeValue}] ${description.trim()}`;

    const isEdit = !!editingActivity;
    setIsSubmitting(true);
    await showLoading(isEdit ? "Memperbarui entri BerAKHLAK..." : "Menyimpan entri BerAKHLAK...", 1000);

    if (editingActivity) {
      // Edit
      const updatedActivity: Activity = {
        ...editingActivity,
        title: fullTitle,
        category: "BerAKHLAK",
        date,
        rhk: rhkToLink,
        timeStart: "",
        timeEnd: "",
        outputCount: 1,
        outputType: "Dokumen",
        hasAttachment: evidenceFiles.length > 0,
        attachmentName: evidenceFiles[0] || undefined,
      };

      setActivities((prev) =>
        prev.map((act) => (act.id === editingActivity.id ? updatedActivity : act))
      );
      triggerNotification("Jurnal BerAKHLAK diperbarui!");
    } else {
      // Add
      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        title: fullTitle,
        category: "BerAKHLAK",
        date,
        timeStart: "",
        timeEnd: "",
        rhk: rhkToLink,
        outputCount: 1,
        outputType: "Dokumen",
        hasAttachment: evidenceFiles.length > 0,
        attachmentName: evidenceFiles[0] || undefined,
      };

      setActivities((prev) => [newActivity, ...prev]);
      triggerNotification("Jurnal BerAKHLAK berhasil ditambahkan!");
    }

    setEditingActivity(null);
    setActivityCategoryPreset(null);
    router.push("/log");
  };

  const activeIcon = coreValues.find((v) => v.name === activeValue)?.icon || "volunteer_activism";

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Page Header Back Nav */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="p-1 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant flex items-center justify-center cursor-pointer border-none bg-transparent"
          aria-label="Kembali"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <span className="font-headline-md text-headline-md text-primary font-bold">Jurnal BerAKHLAK</span>
      </div>

      {/* Horizontal Scrollable Core Values Menu */}
      <div className="w-full overflow-x-auto scrollbar-none py-2 -mx-4 px-4">
        <div className="flex gap-3 min-w-max pb-1">
          {coreValues.map((val) => {
            const isActive = activeValue === val.name;
            return isActive ? (
              <button
                key={val.name}
                type="button"
                onClick={() => setActiveValue(val.name)}
                className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl border-2 border-primary transition-all shadow-md transform scale-[1.02] z-10 flex-shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">{val.icon}</span>
                <span className="font-label-md text-label-md font-bold">{val.name}</span>
                <span
                  className="material-symbols-outlined text-[14px] text-secondary-container"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </button>
            ) : (
              <button
                key={val.name}
                type="button"
                onClick={() => setActiveValue(val.name)}
                className="flex items-center gap-2 bg-surface-container-lowest text-on-surface-variant px-4 py-2 rounded-full border border-outline-variant hover:bg-surface-container transition-colors flex-shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">{val.icon}</span>
                <span className="font-label-sm text-label-sm font-medium">{val.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Section Header */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <div className="bg-primary-container text-on-primary-container p-2 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">{activeIcon}</span>
          </div>
          <h2 className="font-headline-md text-on-surface text-base font-bold">{activeValue}</h2>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-surface-container-lowest rounded-xl border border-primary/25 shadow-sm flex flex-col relative">
          {/* Accent Line */}
          <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-xl" />
          
          {/* Card Header */}
          <div className="flex justify-between items-center p-4 border-b border-outline-variant bg-surface-container-low/30">
            <div className="flex items-center gap-2 ml-2">
              <span className="material-symbols-outlined text-primary">edit_document</span>
              <h3 className="font-label-md text-primary font-bold">Entri Perilaku Baru</h3>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 flex flex-col gap-4 ml-1">
            {/* Tanggal */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold" htmlFor="tanggal">
                Tanggal
              </label>
              <DatePicker
                id="tanggal"
                value={date}
                onChange={setDate}
              />
            </div>

            {/* Deskripsi Perilaku */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold" htmlFor="deskripsi">
                Deskripsi Perilaku
              </label>
              <textarea
                id="deskripsi"
                required
                rows={4}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Jelaskan tindakan konkrit yang menunjukkan orientasi ${activeValue.toLowerCase()} Anda...`}
                className="w-full rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-sm text-body-sm text-on-surface bg-surface-bright resize-none p-3 focus:outline-none placeholder:text-outline-variant"
              />
              <div className="text-right font-body-sm text-outline text-xs mt-1">
                {description.length}/500 karakter
              </div>
            </div>

            {/* Evidence Section */}
            <div className="flex flex-col gap-2">
              <h3 className="font-label-sm text-label-sm text-on-surface-variant font-semibold mb-1">
                Tambahkan Bukti Dukung
              </h3>
              
              {/* Camera Button */}
              <button
                type="button"
                onClick={handleCameraCapture}
                className="w-full bg-primary/5 text-primary border border-primary/20 rounded-lg p-3 flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors active:scale-[0.98] cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">photo_camera</span>
                <span className="font-label-md text-label-md font-bold">Ambil Foto Bukti</span>
              </button>

              <div className="relative flex items-center py-1.5">
                <div className="flex-grow border-t border-outline-variant/40"></div>
                <span className="flex-shrink-0 mx-4 text-outline text-[10px] uppercase font-bold tracking-wider">
                  ATAU
                </span>
                <div className="flex-grow border-t border-outline-variant/40"></div>
              </div>

              {/* File Upload Button */}
              <button
                type="button"
                onClick={handleUploadFile}
                className="w-full border-2 border-dashed border-outline-variant hover:border-primary rounded-lg p-4 flex flex-col items-center justify-center gap-1.5 hover:bg-surface-container-low transition-colors cursor-pointer text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-outline text-2xl">add_a_photo</span>
                <div className="text-center">
                  <span className="font-label-sm text-label-sm text-primary font-semibold block">
                    Unggah Foto / File
                  </span>
                  <span className="font-body-sm text-outline text-[11px] block">
                    PDF, JPG, PNG (Max 5MB)
                  </span>
                </div>
              </button>

              {/* Uploaded Files List */}
              <div className="mt-2 space-y-2">
                {evidenceFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 bg-surface-container-low border border-outline-variant/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 max-w-[80%]">
                      <span className="material-symbols-outlined text-primary text-lg">
                        {file.endsWith(".jpg") ? "image" : "description"}
                      </span>
                      <span className="text-xs text-on-surface truncate font-medium">{file}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-error hover:bg-error-container/20 p-1 rounded-full cursor-pointer border-none bg-transparent flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card Footer Actions */}
          <div className="p-4 border-t border-outline-variant bg-surface-bright rounded-b-xl flex justify-end gap-3 ml-1">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 text-on-surface-variant font-label-md rounded-lg hover:bg-surface-container transition-colors cursor-pointer border-none bg-transparent"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-on-primary font-label-md px-5 py-2.5 rounded-lg hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm border-none cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin shrink-0"></div>
              ) : (
                <span className="material-symbols-outlined text-[18px]">save</span>
              )}
              <span>Simpan Entri</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
