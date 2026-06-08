"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Select, { StylesConfig } from "react-select";
import { useApp, Activity } from "@/context/AppContext";
import DatePicker from "@/components/DatePicker";

const outputOptions = [
  { value: "Dokumen", label: "Dokumen" },
  { value: "Notulensi", label: "Notulensi" },
  { value: "Laporan", label: "Laporan" },
  { value: "Berkas", label: "Berkas" },
  { value: "Foto", label: "Foto" },
  { value: "Lainnya", label: "Lainnya" },
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

export default function AddActivityPage() {
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

  // Map RHK options from context dynamically
  const rhkOptions = rhks.map((r) => ({ value: r.title, label: r.title }));

  const [rhk, setRhk] = useState(() => {
    if (editingActivity && editingActivity.category === "Tugas Rutin") {
      return editingActivity.rhk;
    }
    return rhks[0]?.title || "";
  });
  
  const [date, setDate] = useState(() => {
    if (editingActivity && editingActivity.category === "Tugas Rutin") {
      return editingActivity.date;
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [description, setDescription] = useState(() => {
    if (editingActivity && editingActivity.category === "Tugas Rutin") {
      return editingActivity.title;
    }
    return "";
  });

  const [outputCount, setOutputCount] = useState(() => {
    if (editingActivity && editingActivity.category === "Tugas Rutin") {
      return editingActivity.outputCount;
    }
    return 1;
  });

  const [outputType, setOutputType] = useState(() => {
    if (editingActivity && editingActivity.category === "Tugas Rutin") {
      return editingActivity.outputType;
    }
    return "Dokumen";
  });

  const [evidenceFiles, setEvidenceFiles] = useState<string[]>(() => {
    if (editingActivity && editingActivity.category === "Tugas Rutin" && editingActivity.attachmentName) {
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
    const mockFileName = `dokumen_kegiatan_${randomSuffix}.pdf`;
    setEvidenceFiles((prev) => [...prev, mockFileName]);
    triggerNotification("File berhasil diunggah.");
  };

  const handleCameraCapture = () => {
    const randomSuffix = Math.random().toString(36).substring(5);
    const mockFileName = `foto_kegiatan_${randomSuffix}.jpg`;
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
      alert("Deskripsi kegiatan tidak boleh kosong!");
      return;
    }
    if (!rhk) {
      alert("Silakan pilih Tautan RHK!");
      return;
    }

    const isEdit = !!editingActivity;
    setIsSubmitting(true);
    await showLoading(isEdit ? "Memperbarui kegiatan..." : "Menyimpan kegiatan...", 1000);

    if (editingActivity) {
      // Edit
      const updatedActivity: Activity = {
        ...editingActivity,
        title: description.trim(),
        category: "Tugas Rutin",
        date,
        rhk,
        timeStart: "",
        timeEnd: "",
        outputCount,
        outputType,
        hasAttachment: evidenceFiles.length > 0,
        attachmentName: evidenceFiles[0] || undefined,
      };

      setActivities((prev) =>
        prev.map((act) => (act.id === editingActivity.id ? updatedActivity : act))
      );
      triggerNotification("Kegiatan berhasil diperbarui!");
    } else {
      // Add
      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        title: description.trim(),
        category: "Tugas Rutin",
        date,
        timeStart: "",
        timeEnd: "",
        rhk,
        outputCount,
        outputType,
        hasAttachment: evidenceFiles.length > 0,
        attachmentName: evidenceFiles[0] || undefined,
      };

      setActivities((prev) => [newActivity, ...prev]);
      triggerNotification("Kegiatan baru berhasil ditambahkan!");
    }

    setEditingActivity(null);
    setActivityCategoryPreset(null);
    router.push("/log");
  };

  return (
    <div className="w-full flex flex-col gap-6">
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
        <span className="font-headline-md text-headline-md text-primary font-bold">Kembali ke Logbook</span>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background font-bold">
            Input Kegiatan
          </h1>
          <button
            type="button"
            onClick={() => triggerNotification("Tautan RHK menautkan aktivitas dengan sasaran kerja.")}
            className="p-2 text-primary hover:bg-surface-variant rounded-full transition-colors border-none bg-transparent flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* RHK Link Card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm">
            <label className="block font-label-md text-sm font-semibold text-on-surface-variant mb-2" htmlFor="rhk">
              Tautan RHK
            </label>
            <Select
              instanceId="input-rhk-select"
              value={rhkOptions.find((opt) => opt.value === rhk) || null}
              onChange={(val) => setRhk(val ? val.value : "")}
              options={rhkOptions}
              styles={customSelectStyles}
              placeholder="Pilih Rencana Hasil Kerja..."
              isSearchable={true}
              menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            />
          </div>

          {/* Date Card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm">
            <label className="block font-label-md text-sm font-semibold text-on-surface-variant mb-2" htmlFor="date">
              Tanggal
            </label>
            <DatePicker
              id="date"
              value={date}
              onChange={setDate}
            />
          </div>

          {/* Activity Description Card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm">
            <label className="block font-label-md text-sm font-semibold text-on-surface-variant mb-2" htmlFor="description">
              Deskripsi Kegiatan
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan aktivitas yang dilakukan secara spesifik..."
              className="w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-body-md text-on-surface text-sm resize-none placeholder:text-outline-variant"
            />
          </div>

          {/* Output Card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface-variant mb-1.5">
                  Jumlah Output
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={outputCount}
                  onChange={(e) => setOutputCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-surface-bright border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block font-label-md text-xs font-semibold text-on-surface-variant mb-1.5">
                  Jenis Output
                </label>
                <Select
                  instanceId="input-output-select"
                  value={outputOptions.find((opt) => opt.value === outputType) || null}
                  onChange={(val) => setOutputType(val ? val.value : "Dokumen")}
                  options={outputOptions}
                  styles={customSelectStyles}
                  placeholder="Output..."
                  isSearchable={false}
                  menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                />
              </div>
            </div>
          </div>

          {/* Evidence Section */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm">
            <label className="block font-label-md text-sm font-semibold text-on-surface-variant mb-2">
              Bukti Dukung
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCameraCapture}
                  className="flex flex-col items-center justify-center gap-2 p-3 bg-surface-bright border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-primary text-2xl">photo_camera</span>
                  <span className="font-label-md text-xs text-on-surface font-semibold">Ambil Foto</span>
                </button>
                <button
                  type="button"
                  onClick={handleUploadFile}
                  className="flex flex-col items-center justify-center gap-2 p-3 bg-surface-bright border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-primary text-2xl">upload_file</span>
                  <span className="font-label-md text-xs text-on-surface font-semibold">Unggah File</span>
                </button>
              </div>
              
              {/* Dashed Drag & Drop Trigger */}
              <div
                onClick={handleUploadFile}
                className="relative border-2 border-dashed border-outline-variant hover:border-primary rounded-lg p-6 text-center hover:bg-surface-container-low transition-colors cursor-pointer select-none"
              >
                <span className="material-symbols-outlined text-outline text-3xl mb-1.5 block">upload_file</span>
                <p className="font-body-sm text-xs text-on-surface-variant font-medium">
                  Tap untuk unggah file-file dokumen (PDF/JPG)
                </p>
              </div>

              {/* Uploaded Files List */}
              <div className="mt-2 space-y-2">
                {evidenceFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 bg-surface-container border border-outline-variant rounded-lg"
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
                {evidenceFiles.length === 0 && (
                  <p className="text-[11px] text-outline italic px-2">
                    Belum ada file tambahan yang diunggah
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-3 px-4 bg-surface-container-lowest border border-outline-variant text-primary font-semibold text-sm rounded-lg active:scale-95 hover:bg-surface-container-low transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-primary text-on-primary font-semibold text-sm rounded-lg active:scale-[0.98] hover:bg-primary-container transition-all shadow-md cursor-pointer border-none disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin shrink-0"></div>}
              <span>Simpan Kegiatan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
