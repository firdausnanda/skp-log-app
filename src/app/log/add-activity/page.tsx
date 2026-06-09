"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Select, { StylesConfig } from "react-select";
import { useApp, Activity } from "@/context/AppContext";
import DatePicker from "@/components/DatePicker";
import dynamic from "next/dynamic";

const Camera = dynamic(
  () => import("react-webcam-pro").then((mod) => mod.Camera),
  { ssr: false }
);



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

const periodOptions = [
  { value: "2026", label: "Tahunan 2026" },
  { value: "2025", label: "Tahunan 2025" },
  { value: "2024", label: "Tahunan 2024" },
];

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

  const [isRhkLoading, setIsRhkLoading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const cameraRef = useRef<any>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<Record<string, string>>({});

  const [period, setPeriod] = useState(() => {
    if (editingActivity && editingActivity.category === "Tugas Rutin") {
      const assoc = rhks.find((r) => r.title === editingActivity.rhk);
      if (assoc) return assoc.period;
    }
    return "2026";
  });

  const filteredRhks = rhks.filter((r) => r.period === period);
  const rhkOptions = filteredRhks.map((r) => ({ value: r.title, label: r.title }));

  const [rhk, setRhk] = useState(() => {
    if (editingActivity && editingActivity.category === "Tugas Rutin") {
      return editingActivity.rhk;
    }
    const initialPeriod = "2026";
    const initialFiltered = rhks.filter((r) => r.period === initialPeriod);
    return initialFiltered[0]?.title || "";
  });

  useEffect(() => {
    if (period) {
      const exists = filteredRhks.some((r) => r.title === rhk);
      if (!exists) {
        setRhk(filteredRhks[0]?.title || "");
      }
    }
  }, [period]);
  
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
    if (editingActivity && editingActivity.category === "Tugas Rutin") {
      if (editingActivity.attachments && editingActivity.attachments.length > 0) {
        return editingActivity.attachments.map((a) => a.name);
      }
      if (editingActivity.attachmentName) {
        return [editingActivity.attachmentName];
      }
    }
    return [];
  });

  const [existingUrls, setExistingUrls] = useState<Record<string, string>>(() => {
    const urls: Record<string, string> = {};
    if (editingActivity && editingActivity.category === "Tugas Rutin") {
      if (editingActivity.attachments && editingActivity.attachments.length > 0) {
        editingActivity.attachments.forEach((a) => {
          urls[a.name] = a.url;
        });
      } else if (editingActivity.attachmentName && editingActivity.attachmentUrl) {
        urls[editingActivity.attachmentName] = editingActivity.attachmentUrl;
      }
    }
    return urls;
  });

  const [fileObjects, setFileObjects] = useState<Record<string, File | Blob>>({});

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = () => {
    fileInputRef.current?.click();
  };

  const handleCameraCapture = () => {
    setShowCameraModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "upload" | "camera") => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name;
      setEvidenceFiles((prev) => [...prev, fileName]);
      setFileObjects((prev) => ({ ...prev, [fileName]: file }));
      triggerNotification(
        type === "camera"
          ? `Foto "${fileName}" berhasil diambil.`
          : `File "${fileName}" berhasil diunggah.`
      );
      e.target.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    const fileName = evidenceFiles[index];
    setEvidenceFiles((prev) => prev.filter((_, idx) => idx !== index));
    if (fileName) {
      setFileObjects((prev) => {
        const copy = { ...prev };
        delete copy[fileName];
        return copy;
      });
      setExistingUrls((prev) => {
        const copy = { ...prev };
        delete copy[fileName];
        return copy;
      });
    }
    triggerNotification("Bukti dukung dihapus.");
  };

  const handleViewFile = (file: string) => {
    if (fileObjects[file]) {
      const fileObj = fileObjects[file];
      const objectUrl = URL.createObjectURL(fileObj);
      window.open(objectUrl, "_blank");
    } else if (capturedPhotos[file]) {
      const photoUrl = capturedPhotos[file];
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(`
          <html>
            <head>
              <title>Preview Foto</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; background: #000; height: 100vh; }
                img { max-width: 100%; max-height: 100%; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${photoUrl}" />
            </body>
          </html>
        `);
        newTab.document.close();
      }
    } else if (existingUrls[file]) {
      window.open(existingUrls[file], "_blank");
    } else {
      alert("Berkas tidak dapat ditampilkan.");
    }
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

    const uploadedAttachments: { name: string; url: string }[] = [];

    for (const fileName of evidenceFiles) {
      if (fileObjects[fileName]) {
        try {
          const uploadFormData = new FormData();
          const fileObj = fileObjects[fileName];
          uploadFormData.append("file", fileObj, fileName);
          uploadFormData.append("rhk", rhk);
          uploadFormData.append("category", "Tugas Rutin");
          const uploadYear = period || (date ? date.split("-")[0] : new Date().getFullYear().toString());
          const months = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
          ];
          const dateParts = date ? date.split("-") : [];
          const monthIndex = dateParts[1] ? parseInt(dateParts[1], 10) - 1 : new Date().getMonth();
          const uploadMonth = months[monthIndex] || months[new Date().getMonth()];

          uploadFormData.append("year", uploadYear);
          uploadFormData.append("month", uploadMonth);

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error || `Gagal mengunggah berkas ${fileName}!`);
          }

          const uploadData = await uploadRes.json();
          uploadedAttachments.push({ name: fileName, url: uploadData.url });
        } catch (uploadErr: any) {
          console.error("Error uploading file", uploadErr);
          alert(uploadErr.message || `Gagal mengunggah berkas ${fileName}!`);
          setIsSubmitting(false);
          return;
        }
      } else if (existingUrls[fileName]) {
        uploadedAttachments.push({ name: fileName, url: existingUrls[fileName] });
      }
    }

    const activityPayload = {
      id: editingActivity?.id,
      title: description.trim(),
      category: "Tugas Rutin",
      date,
      rhk,
      period,
      outputCount,
      outputType,
      attachmentName: uploadedAttachments[0]?.name || null,
      attachmentUrl: uploadedAttachments[0]?.url || null,
      attachments: uploadedAttachments,
    };

    try {
      if (editingActivity) {
        // Edit
        const res = await fetch("/api/activity", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activityPayload),
        });

        if (res.ok) {
          const updatedActivity: Activity = await res.json();
          setActivities((prev) =>
            prev.map((act) => (act.id === editingActivity.id ? updatedActivity : act))
          );
          triggerNotification("Kegiatan berhasil diperbarui!");
        } else {
          const err = await res.json();
          alert(`Gagal memperbarui kegiatan: ${err.error}`);
          setIsSubmitting(false);
          return;
        }
      } else {
        // Add
        const res = await fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activityPayload),
        });

        if (res.ok) {
          const newActivity: Activity = await res.json();
          setActivities((prev) => [newActivity, ...prev]);
          triggerNotification("Kegiatan baru berhasil ditambahkan!");
        } else {
          const err = await res.json();
          alert(`Gagal menyimpan kegiatan: ${err.error}`);
          setIsSubmitting(false);
          return;
        }
      }

      setEditingActivity(null);
      setActivityCategoryPreset(null);
      router.push("/log");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan koneksi.");
      setIsSubmitting(false);
    }
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
          {/* Period Card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm">
            <label className="block font-label-md text-sm font-semibold text-on-surface-variant mb-2" htmlFor="period">
              Periode
            </label>
            <Select
              instanceId="input-period-select"
              value={periodOptions.find((opt) => opt.value === period) || null}
              onChange={(val) => {
                const newPeriod = val ? val.value : "2026";
                setIsRhkLoading(true);
                setPeriod(newPeriod);
                setTimeout(() => {
                  setIsRhkLoading(false);
                }, 400);
              }}
              options={periodOptions}
              styles={customSelectStyles}
              placeholder="Pilih Periode..."
              isSearchable={false}
              menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            />
          </div>

          {/* RHK Link Card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm">
            <label className="block font-label-md text-sm font-semibold text-on-surface-variant mb-2" htmlFor="rhk">
              Tautan RHK
            </label>
            <Select
              instanceId="input-rhk-select"
              value={rhkOptions.find((opt) => opt.value === rhk) || null}
              onChange={(val) => {
                setRhk(val ? val.value : "");
                setIsRhkLoading(true);
                setTimeout(() => {
                  setIsRhkLoading(false);
                }, 250);
              }}
              options={rhkOptions}
              styles={customSelectStyles}
              placeholder="Pilih Rencana Hasil Kerja..."
              isSearchable={true}
              isLoading={isRhkLoading}
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

              {/* Hidden Inputs for File Upload */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf,image/*"
                onChange={(e) => handleFileChange(e, "upload")}
              />
              
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
                      {capturedPhotos[file] ? (
                        <img
                          src={capturedPhotos[file]}
                          className="w-8 h-8 object-cover rounded-md border border-outline-variant"
                          alt="Captured preview"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-primary text-lg">
                          {file.endsWith(".jpg") || file.endsWith(".png") ? "image" : "description"}
                        </span>
                      )}
                      <span className="text-xs text-on-surface truncate font-medium">{file}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleViewFile(file)}
                        className="text-primary hover:bg-primary/10 p-1.5 rounded-full cursor-pointer border-none bg-transparent flex items-center justify-center"
                        title="Lihat Berkas"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-error hover:bg-error-container/20 p-1.5 rounded-full cursor-pointer border-none bg-transparent flex items-center justify-center"
                        title="Hapus Berkas"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
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
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/80 z-[10000] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          {/* Modal Header */}
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl relative flex flex-col h-[500px]">
            <div className="flex justify-between items-center p-4 border-b border-outline-variant bg-surface">
              <span className="font-headline-md text-sm text-on-surface font-bold">Ambil Foto Bukti</span>
              <button
                type="button"
                onClick={() => setShowCameraModal(false)}
                className="p-1 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Camera Viewport */}
            <div className="flex-grow bg-black relative flex items-center justify-center overflow-hidden">
              <Camera
                ref={cameraRef}
                aspectRatio="cover"
                errorMessages={{
                  noCameraAccessible: "Kamera tidak dapat diakses.",
                  permissionDenied: "Izin akses kamera ditolak.",
                  switchCamera: "Gagal memindah kamera.",
                  canvas: "Browser Anda tidak mendukung pengambilan gambar.",
                }}
              />
            </div>

            {/* Camera Controls */}
            <div className="p-5 border-t border-outline-variant bg-surface flex justify-center items-center gap-6">
              {/* Switch Camera Button */}
              <button
                type="button"
                onClick={() => {
                  if (cameraRef.current) {
                    cameraRef.current.switchCamera();
                  }
                }}
                className="p-3 bg-surface-container hover:bg-surface-variant text-on-surface rounded-full transition-all active:scale-95 cursor-pointer border-none flex items-center justify-center"
                title="Putar Kamera"
              >
                <span className="material-symbols-outlined text-xl">flip_camera_ios</span>
              </button>

              {/* Shutter Capture Button */}
              <button
                type="button"
                onClick={async () => {
                  if (cameraRef.current) {
                    const photo = cameraRef.current.takePhoto();
                    if (photo) {
                      const fileName = `foto_kegiatan_${Date.now()}.jpg`;
                      setEvidenceFiles((prev) => [...prev, fileName]);
                      setCapturedPhotos((prev) => ({ ...prev, [fileName]: photo }));
                      
                      try {
                        const blobRes = await fetch(photo);
                        const blob = await blobRes.blob();
                        setFileObjects((prev) => ({ ...prev, [fileName]: blob }));
                      } catch (err) {
                        console.error("Failed to convert captured photo to blob", err);
                      }

                      triggerNotification("Foto berhasil ditangkap!");
                      setShowCameraModal(false);
                    }
                  }
                }}
                className="w-16 h-16 bg-primary text-on-primary rounded-full hover:scale-105 transition-all active:scale-95 cursor-pointer border-none flex items-center justify-center shadow-lg"
              >
                <span className="material-symbols-outlined text-3xl text-white">photo_camera</span>
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => setShowCameraModal(false)}
                className="p-3 bg-surface-container hover:bg-surface-variant text-error rounded-full transition-all active:scale-95 cursor-pointer border-none flex items-center justify-center"
                title="Batal"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
