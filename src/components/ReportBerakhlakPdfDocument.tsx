import React from "react";
import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { Activity as AppActivity } from "@/context/AppContext";

const INDO_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const INDO_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const formatMonthYear = (dateStr: string) => {
  const parts = dateStr.split("-");
  if (parts.length >= 2) {
    const monthIndex = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    return `${INDO_MONTHS[monthIndex]} ${year}`;
  }
  return dateStr;
};

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
    paddingLeft: 60,
    paddingRight: 50,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#000",
    lineHeight: 1.5,
  },

  headerCenter: {
    textAlign: "center",
    marginBottom: 20,
  },
  titleBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  metaLabel: {
    width: 60,
  },
  metaColon: {
    width: 15,
    textAlign: "center",
  },
  metaValue: {
    flex: 1,
    fontFamily: "Helvetica-Bold",
  },

  // Table Styles
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
  },
  colInstrumen: {
    width: "35%", // Total 35% dari tabel
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  colRightWrapper: {
    width: "65%", // Total 65% dari tabel (Sisa dari 35%)
    flexDirection: "column",
  },
  innerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  innerRowLast: {
    flexDirection: "row",
  },
  colRubrik: {
    width: "70%", // 70% dari 65% wrapper
    borderRightWidth: 1,
    borderRightColor: "#000",
    padding: 8,
  },
  colEkspektasi: {
    width: "30%", // 30% dari 65% wrapper
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },

  paragraph: {
    textAlign: "justify",
    marginBottom: 10,
    textIndent: 30,
  },
  listRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 10,
  },
  listNumber: {
    width: 20,
  },
  listContent: {
    flex: 1,
  },

  // Styles untuk Halaman Bukti Dukung
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
    height: 60,
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

interface ReportBerakhlakPdfDocumentProps {
  activities: Activity[];
  aspect: string;
  user: User | null;
}

const getWujudPerbuatan = (title: string) => {
  const match = title.match(/^\[.*?\]\s*(.*)$/);
  return match ? match[1] : title;
};

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

const BERAKHLAK_SCHEMAS: Record<
  string,
  {
    title: string;
    instrumen: string;
    diatasEkspektasi: string;
    sesuaiEkspektasi: string;
    dibawahEkspektasi: string;
  }
> = {
  "Berorientasi Pelayanan": {
    title: "PERILAKU KERJA ASN (BerAKHLAK) 1. BERORIENTASI PELAYANAN",
    instrumen: "Memahami Dan Memenuhi Kebutuhan Masyarakat/Organisasi",
    diatasEkspektasi: "Memberikan pelayanan lebih cepat dari SOP/TL Disposisi yang selesai lebih awal/ketuntasan pekerjaan lebih awal dari deadline",
    sesuaiEkspektasi: "Memberikan pelayanan sesuai dari SOP/TL disposisi yang selesai tepat waktu/ketuntasan pekerjaan sesuai deadline",
    dibawahEkspektasi: "Memberikan pelayanan melebihi dari waktu dari SOP/TL disposisi melebihi waktu yang ditentukan/ketuntasan pekerjaan melewati deadline",
  },
  "Akuntabel": {
    title: "PERILAKU KERJA ASN (BerAKHLAK) 2. AKUNTABEL",
    instrumen: "Melaksanakan Tugas Dengan Jujur, Bertanggung Jawab, Cermat, Disiplin Dan Berintegritas Tinggi",
    diatasEkspektasi: "Selalu masuk kerja sesuai ketentuan dan tidak pernah terlambat datang dan pulang cepat",
    sesuaiEkspektasi: "Pernah tidak masuk kerja dengan keterangan yang sah (sakit, izin, cuti) serta frekuensi terlambat datang dan pulang cepat maksimal 30 menit",
    dibawahEkspektasi: "Pernah tidak masuk kerja tanpa keterangan yang sah dan terlambat datang dan pulang cepat lebih dari 30 menit",
  },
  "Kompeten": {
    title: "PERILAKU KERJA ASN (BerAKHLAK) 3. KOMPETEN",
    instrumen: "Meningkatkan Kompetensi Diri Untuk Menjawab Tantangan Yang Selalu Berubah",
    diatasEkspektasi: "Mengikuti pengembangan kompetensi >=3 kali dan atau minimal 9 JP",
    sesuaiEkspektasi: "Mengikuti pengembangan kompetensi 1-2 kali dan atau minimal 3 JP",
    dibawahEkspektasi: "Tidak mengikuti pengembangan kompetensi",
  },
  "Harmonis": {
    title: "PERILAKU KERJA ASN (BerAKHLAK) 4. HARMONIS",
    instrumen: "Membangun Lingkungan Kerja Yang Kondusif",
    diatasEkspektasi: "Terdapat dialog kinerja internal disertai notula",
    sesuaiEkspektasi: "Terdapat dialog kinerja internal",
    dibawahEkspektasi: "Tidak terdapat dialog kinerja internal",
  },
  "Loyal": {
    title: "PERILAKU KERJA ASN (BerAKHLAK) 5. LOYAL",
    instrumen: "Memegang Teguh Ideologi Pancasila, UUD 1945, NKRI Serta Menjaga Nama Baik ASN",
    diatasEkspektasi: "Selalu mengikuti upacara dan apel pagi/senam serta menggunakan atribut pakaian dinas sesuai ketentuan",
    sesuaiEkspektasi: "Pernah tidak mengikuti upacara dan apel pagi/senam dengan keterangan yang sah serta menggunakan atribut pakaian dinas sesuai ketentuan",
    dibawahEkspektasi: "Pernah tidak mengikuti upacara dan apel pagi/senam tanpa keterangan yang sah dan tidak menggunakan atribut pakaian dinas sesuai ketentuan",
  },
  "Adaptif": {
    title: "PERILAKU KERJA ASN (BerAKHLAK) 6. ADAPTIF",
    instrumen: "Cepat Menyesuaikan Diri Menghadapi Perubahan Serta Terus Berinovasi",
    diatasEkspektasi: "Mempunyai dan menjalankan 1 ide/kreativitas/inovasi sesuai tusi",
    sesuaiEkspektasi: "Menjalankan ide/kreativitas/inovasi sesuai tusi",
    dibawahEkspektasi: "Tidak menjalankan ide/kreativitas/inovasi dalam menunjang tusi ",
  },
  "Kolaboratif": {
    title: "PERILAKU KERJA ASN (BerAKHLAK) 7. KOLABORATIF",
    instrumen: "Terbuka Dalam Bekerja Sama Untuk Menghasilkan Nilai Tambah",
    diatasEkspektasi: "Memiliki SK Tim/Surat Tugas/ Foto Kegiatan & Notula lebih dari 1.",
    sesuaiEkspektasi: "Memiliki SK Tim/Surat Tugas/ Foto Kegiatan & Notula hanya 1.",
    dibawahEkspektasi: "Tidak memiliki SK Tim/Surat Tugas/ Foto Kegiatan & Notula.",
  },
};

export default function ReportBerakhlakPdfDocument({ activities, aspect, user }: ReportBerakhlakPdfDocumentProps) {
  const currentSchema = BERAKHLAK_SCHEMAS[aspect] || BERAKHLAK_SCHEMAS["Berorientasi Pelayanan"];
  const sortedActivities = [...activities].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sampleDate = sortedActivities[0]?.date || new Date().toISOString().split("T")[0];
  const periodStr = formatMonthYear(sampleDate);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header Dokumen */}
        <View style={styles.headerCenter}>
          <Text style={styles.titleBold}>DOKUMENTASI/DATA DUKUNG</Text>
          <Text style={styles.titleBold}>{currentSchema.title}</Text>
        </View>

        {/* Tabel Rubrik Penilaian */}
        <View style={styles.table}>

          {/* PERBAIKAN: Header Tabel Disamakan Strukturnya Dengan Data Row */}
          <View style={styles.tableHeader}>
            <View style={styles.colInstrumen}>
              <Text style={{ textAlign: "center" }}>INSTRUMEN</Text>
            </View>
            <View style={[styles.colRightWrapper, { flexDirection: "row" }]}>
              <View style={styles.colRubrik}>
                <Text style={{ textAlign: "center" }}>RUBRIK PENILAIAN</Text>
              </View>
              <View style={styles.colEkspektasi}>
                <Text style={{ textAlign: "center" }}>EKSPEKTASI</Text>
              </View>
            </View>
          </View>

          {/* Isi Tabel */}
          <View style={styles.tableRow}>
            {/* Kolom Kiri */}
            <View style={styles.colInstrumen}>
              <Text style={{ fontWeight: "bold" }}>
                {currentSchema.instrumen}
              </Text>
            </View>

            {/* Kolom Kanan (3 Baris) */}
            <View style={styles.colRightWrapper}>
              <View style={styles.innerRow}>
                <Text style={styles.colRubrik}>
                  {currentSchema.diatasEkspektasi}
                </Text>
                <View style={styles.colEkspektasi}>
                  <Text>Diatas Ekspektasi</Text>
                </View>
              </View>

              <View style={styles.innerRow}>
                <Text style={styles.colRubrik}>
                  {currentSchema.sesuaiEkspektasi}
                </Text>
                <View style={styles.colEkspektasi}>
                  <Text>Sesuai Ekspektasi</Text>
                </View>
              </View>

              <View style={styles.innerRowLast}>
                <Text style={styles.colRubrik}>
                  {currentSchema.dibawahEkspektasi}
                </Text>
                <View style={styles.colEkspektasi}>
                  <Text>Dibawah Ekspektasi</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Meta Info */}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Bulan</Text>
          <Text style={styles.metaColon}>:</Text>
          <Text style={styles.metaValue}>{periodStr}</Text>
        </View>

        {/* Paragraf Pendahuluan */}
        {aspect === "Berorientasi Pelayanan" && (
          <Text style={styles.paragraph}>
            Dalam rangka mendukung penguatan budaya kerja Aparatur Sipil Negara (ASN) sesuai nilai dasar ASN BerAKHLAK sebagaimana diatur dalam Undang Undang Nomor 20 Tahun 2023 tentang ASN serta kebijakan penguatan core values ASN oleh Kementerian Pendayagunaan Aparatur Negara dan Reformasi Birokrasi, maka setiap ASN wajib mengimplementasikan nilai BerAKHLAK dalam pelaksanaan tugas sehari-hari. Sesuai petunjuk dan arahan atasan langsung untuk Tindak Lanjut permintaan data sebagai berikut:
          </Text>
        )}

        {/* Daftar Tindak Lanjut / Kegiatan dari Array Activities */}
        {sortedActivities.map((act, index) => (
          <View style={styles.listRow} key={`list-${act.id}`}>
            <Text style={styles.listNumber}>{index + 1}.</Text>
            <Text style={styles.listContent}>{getWujudPerbuatan(act.title)}</Text>
          </View>
        ))}

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

      {/* Halaman 2 dan seterusnya: Bukti Dukung per Kegiatan */}
      {sortedActivities.map((act) => (
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
              <Text style={{ fontSize: 10, color: "#1f2937", lineHeight: 1.4 }}>{getWujudPerbuatan(act.title)}</Text>
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
    </Document>
  );
}