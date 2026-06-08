"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { useApp } from "@/context/AppContext";

const monthOptions = [
  { value: "Juni 2026", label: "Juni 2026" },
  { value: "Mei 2026", label: "Mei 2026" },
  { value: "April 2026", label: "April 2026" },
  { value: "Maret 2026", label: "Maret 2026" },
  { value: "Februari 2026", label: "Februari 2026" },
  { value: "Januari 2026", label: "Januari 2026" },
];

const rhkOptions = [
  { value: "Semua RHK", label: "Semua RHK" },
  { value: "RHK #1: Penyusunan Rencana Strategis Tahunan", label: "RHK #1: Penyusunan Rencana Strategis Tahunan" },
  { value: "RHK #2: Koordinasi Lintas Sektoral Kinerja Daerah", label: "RHK #2: Koordinasi Lintas Sektoral Kinerja Daerah" },
  { value: "RHK #3: Pengelolaan Pengarsipan Berkas Digital", label: "RHK #3: Pengelolaan Pengarsipan Berkas Digital" },
  { value: "RHK #4: Evaluasi Mingguan Kepatuhan Administrasi", label: "RHK #4: Evaluasi Mingguan Kepatuhan Administrasi" },
];

const statusOptions = [
  { value: "Semua Status", label: "Semua Status" },
  { value: "Selesai", label: "Selesai" },
  { value: "Dalam Proses", label: "Dalam Proses" },
];

const customSelectStyles = {
  control: (provided: any, state: any) => ({
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
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "var(--color-surface-container-lowest)",
    borderRadius: "0.5rem",
    border: "1px solid var(--color-outline-variant)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  }),
  option: (provided: any, state: any) => ({
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
  singleValue: (provided: any) => ({
    ...provided,
    color: "var(--color-on-surface)",
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "var(--color-outline)",
  }),
  menuPortal: (provided: any) => ({
    ...provided,
    zIndex: 9999,
  }),
};

export default function ReportsTab() {
  const { triggerNotification, showLoading } = useApp();

  const [month, setMonth] = useState("Juni 2026");
  const [rhk, setRhk] = useState("Semua RHK");
  const [status, setStatus] = useState("Semua Status");
  const [isFiltering, setIsFiltering] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isExcelLoading, setIsExcelLoading] = useState(false);

  // Client-side rendering portal check
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleApplyFilters = async () => {
    setIsFiltering(true);
    await showLoading("Menyaring data...", 800);
    setIsFiltering(false);
    triggerNotification(`Filter diterapkan: ${month} • ${rhk} • ${status}`);
  };

  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    await showLoading("Menyusun file PDF...", 1200);
    setIsPdfLoading(false);
    triggerNotification(`Mengunduh PDF Laporan Kinerja (${month})...`);
  };

  const handleDownloadExcel = async () => {
    setIsExcelLoading(true);
    await showLoading("Mengekspor data ke Excel...", 1200);
    setIsExcelLoading(false);
    triggerNotification(`Mengekspor Excel Laporan Kinerja (${month})...`);
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

      {/* Filter Section */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] flex flex-col gap-4">
        <h2 className="font-label-md text-label-md text-on-surface font-semibold">
          Filter Laporan
        </h2>
        
        <div className="flex flex-col gap-3">
          {/* Month Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Bulan/Tahun
            </label>
            <Select
              instanceId="reports-month-select"
              value={monthOptions.find((opt) => opt.value === month) || null}
              onChange={(val) => setMonth(val ? val.value : "Juni 2026")}
              options={monthOptions}
              styles={customSelectStyles}
              placeholder="Pilih Bulan..."
              isSearchable={false}
              menuPortalTarget={isMounted ? document.body : null}
            />
          </div>

          {/* RHK Dropdown */}
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

          {/* Status Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Status Laporan
            </label>
            <Select
              instanceId="reports-status-select"
              value={statusOptions.find((opt) => opt.value === status) || null}
              onChange={(val) => setStatus(val ? val.value : "Semua Status")}
              options={statusOptions}
              styles={customSelectStyles}
              placeholder="Pilih Status..."
              isSearchable={false}
              menuPortalTarget={isMounted ? document.body : null}
            />
          </div>
        </div>

         <button
          onClick={handleApplyFilters}
          disabled={isFiltering || isPdfLoading || isExcelLoading}
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

      {/* Ekspor Data Section */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-primary">download</span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
            Ekspor Data
          </h2>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">
          Unduh laporan kinerja Anda berdasarkan filter yang dipilih di atas.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={isFiltering || isPdfLoading || isExcelLoading}
            className="w-full h-12 bg-primary hover:bg-primary-container active:scale-[0.98] text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer border-none disabled:opacity-60"
          >
            {isPdfLoading ? (
              <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin shrink-0"></div>
            ) : (
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
            )}
            Unduh PDF
          </button>
          
          <button
            onClick={handleDownloadExcel}
            disabled={isFiltering || isPdfLoading || isExcelLoading}
            className="w-full h-12 bg-surface-container-lowest hover:bg-surface-container-low active:scale-[0.98] border border-outline text-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
          >
            {isExcelLoading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0"></div>
            ) : (
              <span className="material-symbols-outlined text-[20px]">table_view</span>
            )}
            Ekspor Excel
          </button>
        </div>
      </section>
    </div>
  );
}
