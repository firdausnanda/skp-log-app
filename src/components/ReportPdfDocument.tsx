import React from "react";
import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { Activity as AppActivity } from "@/context/AppContext";

const INDO_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const INDO_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Helper untuk format tanggal "Mei 2026" (Untuk Poin 4)
const formatMonthYear = (dateStr: string) => {
  const parts = dateStr.split("-");
  if (parts.length >= 2) {
    const monthIndex = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    return `${INDO_MONTHS[monthIndex]} ${year}`;
  }
  return dateStr;
};

// Helper untuk format tanggal "29 Mei 2026" (Untuk Tanda Tangan)
const formatFullDate = (dateStr: string) => {
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

// Resolve relative URLs to absolute URLs using window.location.origin
const getAbsoluteUrl = (url: string) => {
  if (!url) return "";
  
  // Check if it's a Google Drive link
  const matchD = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const matchId = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  const fileId = (matchD && matchD[1]) || (matchId && matchId[1]);
  
  if (fileId) {
    url = `/api/drive-file?id=${fileId}`;
  }

  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  
  // For relative paths (like local uploads or our proxy API), append window origin
  if (typeof window !== "undefined") {
    return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
  }
  return url;
};

// Detect if a file is an image based on its name or URL
const isImageFile = (fileName?: string, url?: string) => {
  const nameToCheck = (fileName || url || "").toLowerCase();
  const cleanName = nameToCheck.split("?")[0];
  return (
    cleanName.endsWith(".jpg") ||
    cleanName.endsWith(".jpeg") ||
    cleanName.endsWith(".png") ||
    cleanName.endsWith(".gif") ||
    cleanName.endsWith(".webp") ||
    cleanName.endsWith(".heic") ||
    cleanName.endsWith(".heif") ||
    nameToCheck.includes("unsplash.com")
  );
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 50,
    paddingLeft: 60, // Margin kiri lebih lebar untuk area jilid/staples
    paddingRight: 50,
    fontFamily: "Helvetica",
    fontSize: 11, // Ukuran font standar dokumen resmi
    color: "#000",
    lineHeight: 1.5,
  },
  header: {
    textAlign: "center",
    marginBottom: 30,
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    paddingBottom: 8,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  number: {
    width: 20,
  },
  labelMain: {
    width: 130, // Total space kiri: 20 + 130 = 150
  },
  subRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 20, // Indentasi untuk a, b, c
  },
  subLetter: {
    width: 20,
  },
  labelSub: {
    width: 110, // Total space kiri: 20 (padding) + 20 + 110 = 150 (Sejajar dengan titik dua labelMain)
  },
  colon: {
    width: 15,
    textAlign: "center",
  },
  value: {
    flex: 1,
  },
  signatureSection: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatureContainer: {
    width: 220,
    textAlign: "center",
  },
  signatureText: {
    marginBottom: 2,
  },
  signatureSpace: {
    height: 60, // Ruang kosong jika tidak ada gambar ttd
  },
  signatureImage: {
    width: 100,
    height: 50,
    marginVertical: 5,
    alignSelf: "center",
  },
  signatureName: {
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
    marginTop: 5,
  },
  buktiImage: {
    maxWidth: "100%",
    maxHeight: 350,
    objectFit: "contain",
    marginVertical: 8,
  },
});

interface Activity extends AppActivity {
  lokasi?: string;
}

interface User {
  name: string;
  nip?: string | null;
  pangkatGolongan?: string | null;
  jabatan?: string | null;
  unitKerja?: string | null;
  tandaTangan?: string | null;
}

interface ReportPdfDocumentProps {
  activities: Activity[];
  user: User | null;
}

const getLastWorkDayOfMonth = (dateStr: string): string => {
  const parts = dateStr.split("-");
  if (parts.length >= 2) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const date = new Date(year, month, 0);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) {
      date.setDate(date.getDate() - 2);
    } else if (dayOfWeek === 6) {
      date.setDate(date.getDate() - 1);
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return dateStr;
};

export default function ReportPdfDocument({ activities, user }: ReportPdfDocumentProps) {
  // Group activities by RHK
  const groups: { rhkTitle: string; activities: Activity[] }[] = [];

  activities.forEach((act) => {
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

  return (
    <Document>
      {groups.map((group, groupIdx) => {
        const sampleDate = group.activities[0]?.date || new Date().toISOString().split("T")[0];
        const periodStr = formatMonthYear(sampleDate);

        return (
          <React.Fragment key={groupIdx}>
            {/* Halaman 1: Laporan Pelaksanaan Kegiatan (RHK Cover) */}
            <Page size="A4" style={styles.page}>

              {/* Header Dokumen */}
              <View style={styles.header}>
                <Text style={styles.title}>LAPORAN PELAKSANAAN KEGIATAN</Text>
                <Text style={styles.title}>CABANG DINAS KEHUTANAN WILAYAH TRENGGALEK</Text>
              </View>

              {/* 1. Pelaksana Kegiatan */}
              <View style={styles.row}>
                <Text style={styles.number}>1.</Text>
                <Text style={styles.value}>Pelaksana Kegiatan</Text>
              </View>

              <View style={styles.subRow}>
                <Text style={styles.subLetter}>a.</Text>
                <Text style={styles.labelSub}>Nama</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{user?.name || "-"}</Text>
              </View>

              <View style={styles.subRow}>
                <Text style={styles.subLetter}>b.</Text>
                <Text style={styles.labelSub}>NIP</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{user?.nip || "-"}</Text>
              </View>

              <View style={styles.subRow}>
                <Text style={styles.subLetter}>c.</Text>
                <Text style={styles.labelSub}>Pangkat/Golongan</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{user?.pangkatGolongan || "-"}</Text>
              </View>

              <View style={styles.subRow}>
                <Text style={styles.subLetter}>d.</Text>
                <Text style={styles.labelSub}>Jabatan</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{user?.jabatan || "-"}</Text>
              </View>

              <View style={styles.subRow}>
                <Text style={styles.subLetter}>e.</Text>
                <Text style={styles.labelSub}>Unit Kerja</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{user?.unitKerja || "Cabang Dinas Kehutanan Wilayah Trenggalek"}</Text>
              </View>

              {/* 2. Jenis Kegiatan (RHK Title) */}
              <View style={styles.row}>
                <Text style={styles.number}>2.</Text>
                <Text style={styles.labelMain}>Jenis Kegiatan</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{group.rhkTitle}</Text>
              </View>

              {/* 3. Tempat Kegiatan */}
              <View style={styles.row}>
                <Text style={styles.number}>3.</Text>
                <Text style={styles.labelMain}>Tempat Kegiatan</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{user?.unitKerja || "CDK Wilayah Trenggalek"}</Text>
              </View>

              {/* 4. Pelaksanaan Kegiatan */}
              <View style={styles.row}>
                <Text style={styles.number}>4.</Text>
                <Text style={styles.labelMain}>Pelaksanaan Kegiatan</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.value}>{periodStr}</Text>
              </View>

              {/* Tanda Tangan */}
              <View style={styles.signatureSection} wrap={false}>
                <View style={styles.signatureContainer}>
                  <Text style={styles.signatureText}>Trenggalek, {formatFullDate(getLastWorkDayOfMonth(sampleDate))}</Text>
                  <Text style={styles.signatureText}>Pelaksana tugas,</Text>

                  {user?.tandaTangan ? (
                    <Image src={getAbsoluteUrl(user.tandaTangan)} style={styles.signatureImage} />
                  ) : (
                    <View style={styles.signatureSpace} />
                  )}

                  <Text style={styles.signatureName}>{user?.name || "-"}</Text>
                  <Text style={styles.signatureText}>NIP. {user?.nip || "-"}</Text>
                </View>
              </View>

            </Page>

            {/* Halaman 2 dan seterusnya: Jurnal Kegiatan dalam RHK */}
            {group.activities.map((act) => (
              <Page size="A4" style={styles.page} key={act.id}>
                {/* Header Bukti Dukung */}
                <View style={styles.header}>
                  <Text style={styles.title}>BUKTI DUKUNG DOKUMEN KEGIATAN</Text>
                  <Text style={styles.title}>CABANG DINAS KEHUTANAN WILAYAH TRENGGALEK</Text>
                </View>

                {/* 1. Tanggal */}
                <View style={styles.row}>
                  <Text style={[styles.number, { fontFamily: "Helvetica-Bold" }]}>1.</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 4 }}>Tanggal Pelaksanaan</Text>
                    <Text style={{ fontSize: 10, color: "#1f2937" }}>{getIndoDay(act.date)}, {formatFullDate(act.date)}</Text>
                  </View>
                </View>

                {/* 2. Kegiatan */}
                <View style={[styles.row, { marginTop: 15 }]}>
                  <Text style={[styles.number, { fontFamily: "Helvetica-Bold" }]}>2.</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 4 }}>Nama Kegiatan</Text>
                    <Text style={{ fontSize: 10, color: "#1f2937", lineHeight: 1.4 }}>{act.title}</Text>
                  </View>
                </View>

                {/* 3. Bukti Dukung */}
                <View style={[styles.row, { marginTop: 15 }]}>
                  <Text style={[styles.number, { fontFamily: "Helvetica-Bold" }]}>3.</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 6 }}>Dokumen Bukti Dukung</Text>
                    
                    {act.attachments && act.attachments.length > 0 ? (
                      act.attachments.map((att, idx) => {
                        const isImg = isImageFile(att.name, att.url);
                        const absoluteUrl = getAbsoluteUrl(att.url);
                        return (
                          <View key={idx} style={{ marginBottom: 15 }}>
                            {isImg ? (
                              <Image src={absoluteUrl} style={styles.buktiImage} />
                            ) : (
                              <Text style={{ fontSize: 9.5, color: "#1f2937" }}>
                                Dokumen: {att.name || `Lampiran Bukti ${idx + 1}`}
                              </Text>
                            )}
                          </View>
                        );
                      })
                    ) : act.attachmentUrl ? (
                      <View>
                        {isImageFile(act.attachmentName, act.attachmentUrl) ? (
                          <Image src={getAbsoluteUrl(act.attachmentUrl)} style={styles.buktiImage} />
                        ) : (
                          <Text style={{ fontSize: 9.5, color: "#1f2937" }}>
                            Dokumen: {act.attachmentName || "Dokumen Pendukung"}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <Text style={{ fontSize: 10, color: "#dc2626", fontFamily: "Helvetica-Bold" }}>
                        Tidak ada bukti dukung yang dilampirkan.
                      </Text>
                    )}
                  </View>
                </View>
              </Page>
            ))}
          </React.Fragment>
        );
      })}
    </Document>
  );
}