"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, Activity } from "@/context/AppContext";
import DatePicker from "@/components/DatePicker";
import dynamic from "next/dynamic";

const Camera = dynamic(
  () => import("react-webcam-pro").then((mod) => mod.Camera),
  { ssr: false }
);

const coreValues = [
  { name: "Berorientasi Pelayanan", icon: "volunteer_activism" },
  { name: "Akuntabel", icon: "verified_user" },
  { name: "Kompeten", icon: "military_tech" },
  { name: "Harmonis", icon: "diversity_3" },
  { name: "Loyal", icon: "favorite" },
  { name: "Adaptif", icon: "sync_alt" },
  { name: "Kolaboratif", icon: "handshake" },
];

function AddBerakhlakForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const valueParam = searchParams.get("value");
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
    if (valueParam) {
      const matched = coreValues.find((v) => v.name.toLowerCase() === valueParam.toLowerCase());
      if (matched) return matched.name;
    }
    return "Berorientasi Pelayanan";
  });

  useEffect(() => {
    if (!editingActivity && valueParam) {
      const matched = coreValues.find((v) => v.name.toLowerCase() === valueParam.toLowerCase());
      if (matched) {
        setActiveValue(matched.name);
      }
    }
  }, [valueParam, editingActivity]);

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
    if (editingActivity && editingActivity.category === "BerAKHLAK") {
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
    if (editingActivity && editingActivity.category === "BerAKHLAK") {
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
  const [showCameraModal, setShowCameraModal] = useState(false);
  const cameraRef = useRef<any>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<Record<string, string>>({});

  const getMonthParamFromDate = (dateStr: string) => {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${months[monthIdx]} ${year}`;
      }
    }
    const today = new Date();
    return `${months[today.getMonth()]} ${today.getFullYear()}`;
  };

  const handleCancel = () => {
    setEditingActivity(null);
    setActivityCategoryPreset(null);
    setLoadingMsg("Kembali...");
    setIsLoading(true);
    const monthParam = getMonthParamFromDate(date);
    setTimeout(() => {
      router.push(`/log/history-berakhlak/detail?month=${encodeURIComponent(monthParam)}`);
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

    const uploadedAttachments: { name: string; url: string }[] = [];

    for (const fileName of evidenceFiles) {
      if (fileObjects[fileName]) {
        try {
          const uploadFormData = new FormData();
          const fileObj = fileObjects[fileName];
          uploadFormData.append("file", fileObj, fileName);
          uploadFormData.append("rhk", "BerAKHLAK");
          uploadFormData.append("category", "BerAKHLAK");
          const uploadYear = date ? date.split("-")[0] : new Date().getFullYear().toString();
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
      title: fullTitle,
      category: "BerAKHLAK",
      date,
      rhk: rhkToLink,
      outputCount: 1,
      outputType: "Dokumen",
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
          triggerNotification("Jurnal BerAKHLAK diperbarui!");
        } else {
          const err = await res.json();
          alert(`Gagal memperbarui jurnal BerAKHLAK: ${err.error}`);
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
          triggerNotification("Jurnal BerAKHLAK berhasil ditambahkan!");
        } else {
          const err = await res.json();
          alert(`Gagal menyimpan jurnal BerAKHLAK: ${err.error}`);
          setIsSubmitting(false);
          return;
        }
      }

      setEditingActivity(null);
      setActivityCategoryPreset(null);
      const monthParam = getMonthParamFromDate(date);
      router.push(`/log/history-berakhlak/detail?month=${encodeURIComponent(monthParam)}`);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan koneksi.");
      setIsSubmitting(false);
    }
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

              {/* Hidden Inputs for File Upload */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf,image/*"
                onChange={(e) => handleFileChange(e, "upload")}
              />

              {/* Uploaded Files List */}
              <div className="mt-2 space-y-2">
                {evidenceFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 bg-surface-container-low border border-outline-variant/50 rounded-lg"
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
                      const fileName = `foto_berakhlak_${Date.now()}.jpg`;
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
  );
}

export default function AddBerakhlakPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-8 bg-surface-container-lowest border border-outline-variant rounded-2xl animate-pulse-subtle">
        <span className="material-symbols-outlined text-[48px] text-primary mb-2">find_in_page</span>
        <p className="text-sm text-outline">Memuat halaman Jurnal BerAKHLAK...</p>
      </div>
    }>
      <AddBerakhlakForm />
    </Suspense>
  );
}
