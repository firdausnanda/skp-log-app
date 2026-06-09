import React from "react";

interface HomeTabProps {
  rhkCount: number;
  rhkProgress: number;
  activitiesCount: number;
  buktiDukungCount: number;
  onAddClick: () => void;
  onReportClick: () => void;
}

export default function HomeTab({
  rhkCount,
  rhkProgress,
  activitiesCount,
  buktiDukungCount,
  onAddClick,
  onReportClick,
}: HomeTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Main Actions */}
      <section className="grid grid-cols-2 gap-4">
        <button
          onClick={onAddClick}
          className="bg-primary text-on-primary font-label-md text-label-md py-3.5 px-4 rounded-xl shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            add_circle
          </span>
          Tambah
        </button>
        <button
          onClick={onReportClick}
          className="bg-surface-container-lowest text-primary border border-outline-variant font-label-md text-label-md py-3.5 px-4 rounded-xl shadow-sm hover:bg-surface-container-low active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">description</span>
          Laporan
        </button>
      </section>

      {/* Performance Cards */}
      <section className="flex flex-col gap-4">
        {/* Card 1: Total RHK Tersusun */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-[0px_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-3 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Total RHK Tersusun
            </h2>
            <span className="bg-[#D1FAE5] text-[#065F46] font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#065F46]"></span>
              Aktif
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-xl text-headline-xl text-on-surface">{rhkCount}</span>
            <span className="font-body-sm text-body-sm text-outline">Rencana</span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-2.5 mt-1 overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${rhkProgress}%` }}></div>
          </div>
        </div>

        {/* Card 2: Kegiatan Bulan Ini */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-[0px_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-3 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Kegiatan Bulan Ini
            </h2>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-xl text-headline-xl text-on-surface">{activitiesCount}</span>
            <span className="font-body-sm text-body-sm text-outline">Kegiatan</span>
          </div>
        </div>

        {/* Card 3: Bukti Dukung */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-[0px_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-3 hover:shadow-md transition-shadow">
          <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Bukti Dukung</h2>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-xl text-headline-xl text-on-surface">{buktiDukungCount}</span>
            <span className="font-body-sm text-body-sm text-outline">Dokumen</span>
          </div>
          <div className="font-body-sm text-body-sm text-secondary flex items-center gap-2 mt-1 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            Semua dokumen valid
          </div>
        </div>
      </section>
    </div>
  );
}
