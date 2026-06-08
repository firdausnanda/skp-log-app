"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Activity {
  id: string;
  title: string;
  category: "BerAKHLAK" | "Tugas Rutin";
  date: string; // "YYYY-MM-DD"
  timeStart: string;
  timeEnd: string;
  rhk: string;
  outputCount: number;
  outputType: string;
  hasAttachment: boolean;
  attachmentName?: string;
}

export interface RhkItem {
  id: string;
  type: "Utama" | "Tambahan";
  title: string;
  indicator: string;
  currentProgress: number;
  targetProgress: number;
  period: string; // Year, e.g. "2026"
  months?: number[]; // indices 1-12
}

interface AppContextType {
  activitiesCount: number;
  setActivitiesCount: React.Dispatch<React.SetStateAction<number>>;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  rhkCount: number;
  setRhkCount: React.Dispatch<React.SetStateAction<number>>;
  rhks: RhkItem[];
  setRhks: React.Dispatch<React.SetStateAction<RhkItem[]>>;
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  activityCategoryPreset: "BerAKHLAK" | "Tugas Rutin" | null;
  setActivityCategoryPreset: (preset: "BerAKHLAK" | "Tugas Rutin" | null) => void;
  editingActivity: Activity | null;
  setEditingActivity: (activity: Activity | null) => void;
  triggerNotification: (msg: string) => void;
  showNotification: boolean;
  notificationMsg: string;
  timeString: string;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loadingMsg: string;
  setLoadingMsg: React.Dispatch<React.SetStateAction<string>>;
  showLoading: (msg?: string, duration?: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: "act-1",
      title: "Penyusunan draft laporan kinerja triwulan III Tahun 2023",
      category: "BerAKHLAK",
      date: new Date().toISOString().split("T")[0],
      timeStart: "09:00",
      timeEnd: "11:30",
      rhk: "RHK #1: Penyusunan Rencana Strategis Tahunan",
      outputCount: 1,
      outputType: "Dokumen",
      hasAttachment: true,
      attachmentName: "draft_laporan_q3.pdf",
    },
    {
      id: "act-2",
      title: "Rapat koordinasi teknis pelaksanaan program kerja 2024",
      category: "Tugas Rutin",
      date: new Date().toISOString().split("T")[0],
      timeStart: "13:00",
      timeEnd: "15:00",
      rhk: "RHK #2: Koordinasi Lintas Sektoral Kinerja Daerah",
      outputCount: 1,
      outputType: "Notulensi",
      hasAttachment: false,
    },
    {
      id: "act-3",
      title: "Melakukan integrasi sistem pelaporan kinerja pegawai digital assistant versi mobile",
      category: "BerAKHLAK",
      date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      timeStart: "08:30",
      timeEnd: "10:30",
      rhk: "RHK #3: Pengelolaan Pengarsipan Berkas Digital",
      outputCount: 1,
      outputType: "Laporan Integrasi",
      hasAttachment: true,
      attachmentName: "integration_log.txt",
    },
    {
      id: "act-4",
      title: "Rapat koordinasi perbaikan layout dashboard mempermudah navigasi user",
      category: "Tugas Rutin",
      date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      timeStart: "14:15",
      timeEnd: "16:00",
      rhk: "RHK #4: Evaluasi Mingguan Kepatuhan Administrasi",
      outputCount: 1,
      outputType: "Dokumen Desain",
      hasAttachment: false,
    },
  ]);

  const [rhks, setRhks] = useState<RhkItem[]>([
    {
      id: "rhk-1",
      type: "Utama",
      title: "Penyusunan rencana hasil kerja tahunan strategis organisasi",
      indicator: "Dokumen perencanaan strategis yang disusun secara tepat waktu.",
      currentProgress: 8,
      targetProgress: 10,
      period: "2024",
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    {
      id: "rhk-2",
      type: "Tambahan",
      title: "Pelaksanaan koordinasi lintas sektoral dalam program digitalisasi layanan",
      indicator: "Jumlah laporan koordinasi yang disetujui oleh pimpinan unit kerja.",
      currentProgress: 5,
      targetProgress: 10,
      period: "2024",
      months: [1, 2, 3, 4, 5, 6]
    },
    {
      id: "rhk-3",
      type: "Utama",
      title: "Pengelolaan pengarsipan berkas digital secara terintegrasi",
      indicator: "Persentase arsip digital yang diindeks secara lengkap.",
      currentProgress: 9,
      targetProgress: 12,
      period: "2024",
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    {
      id: "rhk-4",
      type: "Tambahan",
      title: "Evaluasi mingguan terhadap kepatuhan administrasi pelaporan",
      indicator: "Jumlah berkas evaluasi berkala yang diselesaikan.",
      currentProgress: 3,
      targetProgress: 4,
      period: "2024",
      months: [7, 8, 9, 10, 11, 12]
    },
  ]);

  const [activitiesCount, setActivitiesCount] = useState(4);
  const [rhkCount, setRhkCount] = useState(4);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activityCategoryPreset, setActivityCategoryPreset] = useState<"BerAKHLAK" | "Tugas Rutin" | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");
  const [timeString, setTimeString] = useState("08:45");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Memproses...");

  const showLoading = (msg = "Memproses...", duration = 800) => {
    setLoadingMsg(msg);
    setIsLoading(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsLoading(false);
        resolve();
      }, duration);
    });
  };

  useEffect(() => {
    setActivitiesCount(activities.length);
  }, [activities]);

  useEffect(() => {
    setRhkCount(rhks.length);
  }, [rhks]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setTimeString(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const triggerNotification = (message: string) => {
    setNotificationMsg(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  return (
    <AppContext.Provider
      value={{
        activitiesCount,
        setActivitiesCount,
        activities,
        setActivities,
        rhkCount,
        setRhkCount,
        rhks,
        setRhks,
        showAddModal,
        setShowAddModal,
        activityCategoryPreset,
        setActivityCategoryPreset,
        editingActivity,
        setEditingActivity,
        triggerNotification,
        showNotification,
        notificationMsg,
        timeString,
        isLoading,
        setIsLoading,
        loadingMsg,
        setLoadingMsg,
        showLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
