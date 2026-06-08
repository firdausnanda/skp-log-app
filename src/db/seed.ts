import { config } from "dotenv";
config({ path: ".env.local" });

import { db, connection } from "./index";
import { users, rencanaKinerja, skpLog, buktiDukung, perilakuBerakhlak, buktiDukungBerakhlak, account } from "./schema";
import { hashPassword } from "better-auth/crypto";

async function main() {
  console.log("Seeding database...");

  // Clean old data in dependency order
  console.log("Cleaning old data...");
  await db.delete(buktiDukungBerakhlak);
  await db.delete(perilakuBerakhlak);
  await db.delete(buktiDukung);
  await db.delete(skpLog);
  await db.delete(rencanaKinerja);
  await db.delete(account);
  await db.delete(users);

  // 1. Seed User
  console.log("Seeding users...");
  const userId = "4d989f66-8809-40e1-b51f-56bb425c04b4";
  const hashedPassword = await hashPassword("password123");

  await db.insert(users).values({
    id: userId,
    nama: "Firdaus Nanda",
    email: "firdaus@example.com",
    emailVerified: true,
    nip: "199503122020121001",
    username: "firdaus",
    displayUsername: "firdaus",
    jabatan: "Pranata Komputer",
    seksi: "Seksi Pengolahan Data",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
  });

  console.log("Seeding user credentials account...");
  await db.insert(account).values({
    id: crypto.randomUUID(),
    userId: userId,
    accountId: "firdaus@example.com",
    providerId: "credential",
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 2. Seed RHK (Rencana Hasil Kerja)
  console.log("Seeding Rencana Kinerja (RHK)...");
  const rhk1Id = "1a7b8c9d-1234-5678-90ab-cdef12345678";
  const rhk2Id = "2b8c9d0e-1234-5678-90ab-cdef12345678";
  await db.insert(rencanaKinerja).values([
    {
      id: rhk1Id,
      deskripsi: "Penyusunan rencana hasil kerja tahunan strategis organisasi",
      kategori: "UTAMA",
      userId: userId,
      bulanPelaksanaan: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      id: rhk2Id,
      deskripsi: "Pelaksanaan koordinasi lintas sektoral dalam program digitalisasi layanan",
      kategori: "TAMBAHAN",
      userId: userId,
      bulanPelaksanaan: [1, 2, 3, 4, 5, 6],
    },
  ]);

  // 3. Seed SKP Log (Aktivitas Harian)
  console.log("Seeding SKP Logs...");
  const log1Id = "3c9d0e1f-1234-5678-90ab-cdef12345678";
  const log2Id = "4d0e1f2a-1234-5678-90ab-cdef12345678";
  await db.insert(skpLog).values([
    {
      id: log1Id,
      kegiatan: "Penyusunan draft laporan kinerja triwulan III Tahun 2023",
      userId: userId,
      rencanaKinerjaId: rhk1Id,
      tanggal: new Date(),
    },
    {
      id: log2Id,
      kegiatan: "Rapat koordinasi teknis pelaksanaan program kerja 2024",
      userId: userId,
      rencanaKinerjaId: rhk2Id,
      tanggal: new Date(),
    },
  ]);

  // 4. Seed Bukti Dukung
  console.log("Seeding Bukti Dukung...");
  await db.insert(buktiDukung).values([
    {
      id: "5e1f2a3b-1234-5678-90ab-cdef12345678",
      url: "https://example.com/files/draft_laporan_q3.pdf",
      namaFile: "draft_laporan_q3.pdf",
      skpLogId: log1Id,
    },
  ]);

  // 5. Seed Perilaku Kerja BerAKHLAK
  console.log("Seeding Perilaku BerAKHLAK...");
  const perilakuId = "6f2a3b4c-1234-5678-90ab-cdef12345678";
  await db.insert(perilakuBerakhlak).values([
    {
      id: perilakuId,
      tanggal: new Date(),
      aspek: "BERORIENTASI_PELAYANAN",
      wujudPerbuatan: "Melayani masyarakat dengan ramah, cekatan, solutif, dan dapat diandalkan.",
      userId: userId,
    },
  ]);

  // 6. Seed Bukti Dukung BerAKHLAK
  console.log("Seeding Bukti Dukung BerAKHLAK...");
  await db.insert(buktiDukungBerakhlak).values([
    {
      id: "7a3b4c5d-1234-5678-90ab-cdef12345678",
      url: "https://example.com/files/bukti_pelayanan.jpg",
      namaFile: "bukti_pelayanan.jpg",
      perilakuBerakhlakId: perilakuId,
    },
  ]);

  console.log("Database seeded successfully!");
}

main()
  .then(async () => {
    await connection.end();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Error seeding database:", e);
    await connection.end();
    process.exit(1);
  });
