"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Select, { StylesConfig } from "react-select";

interface OptionType {
  value: string;
  label: string;
}
import { useApp, RhkItem } from "@/context/AppContext";

const monthsList = [
  { val: 1, label: "Jan" },
  { val: 2, label: "Feb" },
  { val: 3, label: "Mar" },
  { val: 4, label: "Apr" },
  { val: 5, label: "Mei" },
  { val: 6, label: "Jun" },
  { val: 7, label: "Jul" },
  { val: 8, label: "Agu" },
  { val: 9, label: "Sep" },
  { val: 10, label: "Okt" },
  { val: 11, label: "Nov" },
  { val: 12, label: "Des" },
];

const tahunOptions = [
  { value: "2024", label: "2024" },
  { value: "2025", label: "2025" },
  { value: "2026", label: "2026" },
];

const kategoriOptions = [
  { value: "Utama", label: "Utama" },
  { value: "Tambahan", label: "Tambahan" },
];

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

export default function AddRhkPage() {
  const router = useRouter();
  const { setRhks, triggerNotification, showLoading, setIsLoading, setLoadingMsg, editingRhk, setEditingRhk } = useApp();

  const [tahun, setTahun] = useState(() => editingRhk?.period || "2026");
  const [judul, setJudul] = useState(() => editingRhk?.title || "");
  const [kategori, setKategori] = useState<"Utama" | "Tambahan">(() => editingRhk?.type || "Utama");
  const [selectedMonths, setSelectedMonths] = useState<number[]>(() => editingRhk?.months || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const [isSubmitting, setIsSubmitting] = useState(false);



  const handleMonthToggle = (monthVal: number) => {
    setSelectedMonths((prev) =>
      prev.includes(monthVal)
        ? prev.filter((m) => m !== monthVal)
        : [...prev, monthVal]
    );
  };

  const handleCancel = () => {
    setEditingRhk(null);
    setLoadingMsg("Kembali...");
    setIsLoading(true);
    setTimeout(() => {
      router.push("/rhk");
    }, 350);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      alert("Judul RHK tidak boleh kosong!");
      return;
    }

    setIsSubmitting(true);
    await showLoading(editingRhk ? "Memperbarui RHK..." : "Menyimpan RHK baru...", 1000);

    if (editingRhk) {
      try {
        const res = await fetch("/api/rhk", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingRhk.id,
            title: judul.trim(),
            type: kategori,
            period: tahun,
            months: selectedMonths,
            indicator: editingRhk.indicator,
          }),
        });

        if (res.ok) {
          const updatedRhk = await res.json();
          updatedRhk.currentProgress = editingRhk.currentProgress;

          setRhks((prev) =>
            prev.map((item) => (item.id === editingRhk.id ? updatedRhk : item))
          );
          triggerNotification("RHK berhasil diperbarui!");
          setEditingRhk(null);
          router.push("/rhk");
        } else {
          const errData = await res.json();
          triggerNotification(errData.error || "Gagal memperbarui RHK.");
        }
      } catch (err) {
        console.error(err);
        triggerNotification("Terjadi kesalahan saat memperbarui RHK.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      try {
        const res = await fetch("/api/rhk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: judul.trim(),
            type: kategori,
            period: tahun,
            months: selectedMonths,
            indicator: "Laporan hasil kegiatan capaian kinerja.",
          }),
        });

        if (res.ok) {
          const savedRhk = await res.json();
          setRhks((prev) => [savedRhk, ...prev]);
          triggerNotification("RHK baru berhasil ditambahkan!");
          router.push("/rhk");
        } else {
          const errData = await res.json();
          triggerNotification(errData.error || "Gagal menambahkan RHK.");
        }
      } catch (err) {
        console.error(err);
        triggerNotification("Terjadi kesalahan saat menyimpan RHK.");
      } finally {
        setIsSubmitting(false);
      }
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
        <span className="font-headline-md text-headline-md text-primary font-bold">Kembali ke RHK</span>
      </div>

      <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        {/* Title Card Header */}
        <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              {editingRhk ? "Ubah RHK" : "Tambah RHK Baru"}
            </h2>
            <p className="font-body-sm text-xs text-on-surface-variant mt-1">
              {editingRhk
                ? "Perbarui informasi Rencana Hasil Kerja Anda di bawah ini."
                : "Isi formulir di bawah ini untuk menambahkan Rencana Hasil Kerja."}
            </p>
          </div>
          <span className="material-symbols-outlined text-primary text-3xl opacity-20 select-none text-[32px]">
            {editingRhk ? "edit_note" : "assignment_add"}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5 bg-surface-container-lowest">
          {/* Tahun Pelaksanaan */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tahunPelaksanaan" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Tahun Pelaksanaan <span className="text-error font-bold">*</span>
            </label>
            <Select
              instanceId="tahun-select"
              value={tahunOptions.find((opt) => opt.value === tahun) || null}
              onChange={(val) => setTahun(val ? val.value : "2026")}
              options={tahunOptions}
              styles={customSelectStyles}
              placeholder="Pilih Tahun..."
              isSearchable={false}
              menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            />
          </div>

          {/* Judul RHK */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="judulRhk" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Judul RHK <span className="text-error font-bold">*</span>
            </label>
            <textarea
              id="judulRhk"
              required
              rows={3}
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Masukkan judul Rencana Hasil Kerja secara detail..."
              className="w-full rounded-lg border border-outline-variant bg-surface-bright px-3 py-2.5 text-sm font-body-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none placeholder:text-outline-variant"
            />
          </div>

          {/* Kategori */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="kategori" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Kategori <span className="text-error font-bold">*</span>
            </label>
            <Select
              instanceId="kategori-select"
              value={kategoriOptions.find((opt) => opt.value === kategori) || null}
              onChange={(val) => setKategori(val ? (val.value as "Utama" | "Tambahan") : "Utama")}
              options={kategoriOptions}
              styles={customSelectStyles}
              placeholder="Pilih Kategori..."
              isSearchable={false}
              menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            />
          </div>

          {/* Bulan Pelaksanaan Checkboxes */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Bulan Pelaksanaan <span className="text-error font-bold">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {monthsList.map((m) => {
                const isChecked = selectedMonths.includes(m.val);
                return (
                  <label
                    key={m.val}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-surface-container-low transition-colors select-none ${
                      isChecked
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-outline-variant bg-surface-bright text-on-surface-variant"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMonthToggle(m.val)}
                      className="rounded border-outline-variant text-primary focus:ring-primary/20 w-4 h-4 accent-primary"
                    />
                    <span className="text-xs font-medium">{m.label}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-[10px] text-outline mt-1 leading-normal">
              Pilih bulan-bulan di mana RHK ini akan dilaksanakan.
            </p>
          </div>

          {/* Buttons Footer */}
          <div className="flex gap-3 mt-2 border-t border-outline-variant/30 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2.5 rounded-lg border border-outline bg-surface-container-lowest hover:bg-surface-container-low text-primary font-semibold text-sm cursor-pointer transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm cursor-pointer transition-all flex items-center justify-center gap-1.5 border-none shadow-sm disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin shrink-0"></div>
              ) : (
                <span className="material-symbols-outlined text-[18px]">save</span>
              )}
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
