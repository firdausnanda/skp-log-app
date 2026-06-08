import { mysqlTable, varchar, text, timestamp, mysqlEnum, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ==========================================
// ENUMS / VALUES
// ==========================================
export const kategoriRhkValues = ["UTAMA", "TAMBAHAN"] as const;
export const aspekBerakhlakValues = [
  "BERORIENTASI_PELAYANAN",
  "AKUNTABEL",
  "KOMPETEN",
  "HARMONIS",
  "LOYAL",
  "ADAPTIF",
  "KOLABORATIF",
] as const;

// ==========================================
// TABLES
// ==========================================

// 2. Tabel Users (Pegawai)
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  nama: text("nama").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  image: text("image"),
  password: text("password"),
  nip: varchar("nip", { length: 50 }).unique(),
  jabatan: text("jabatan"),
  seksi: text("seksi"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 3. Tabel Rencana Hasil Kerja (RHK)
export const rencanaKinerja = mysqlTable("rencana_kinerja", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  deskripsi: text("deskripsi").notNull(),
  kategori: mysqlEnum("kategori", kategoriRhkValues).default("UTAMA").notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bulanPelaksanaan: json("bulan_pelaksanaan").$type<number[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 4. Tabel SKP Log (Aktivitas Harian)
export const skpLog = mysqlTable("skp_log", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tanggal: timestamp("tanggal").defaultNow().notNull(),
  kegiatan: text("kegiatan").notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rencanaKinerjaId: varchar("rencana_kinerja_id", { length: 36 })
    .notNull()
    .references(() => rencanaKinerja.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 5. Tabel Bukti Dukung SKP Log
export const buktiDukung = mysqlTable("bukti_dukung", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  url: text("url").notNull(),
  namaFile: text("nama_file"),
  skpLogId: varchar("skp_log_id", { length: 36 })
    .notNull()
    .references(() => skpLog.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Tabel Perilaku Kerja BerAKHLAK (Berdiri Sendiri)
export const perilakuBerakhlak = mysqlTable("perilaku_berakhlak", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tanggal: timestamp("tanggal").defaultNow().notNull(),
  aspek: mysqlEnum("aspek", aspekBerakhlakValues).notNull(),
  wujudPerbuatan: text("wujud_perbuatan").notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 7. Tabel Bukti Dukung Perilaku BerAKHLAK
export const buktiDukungBerakhlak = mysqlTable("bukti_dukung_berakhlak", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  url: text("url").notNull(),
  namaFile: text("nama_file"),
  perilakuBerakhlakId: varchar("perilaku_berakhlak_id", { length: 36 })
    .notNull()
    .references(() => perilakuBerakhlak.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// DEFINISI RELASI
// ==========================================

export const usersRelations = relations(users, ({ many }) => ({
  rencanaKinerja: many(rencanaKinerja),
  skpLogs: many(skpLog),
  perilakuBerakhlak: many(perilakuBerakhlak),
}));

export const rencanaKinerjaRelations = relations(rencanaKinerja, ({ one, many }) => ({
  user: one(users, {
    fields: [rencanaKinerja.userId],
    references: [users.id],
  }),
  skpLogs: many(skpLog),
}));

export const skpLogRelations = relations(skpLog, ({ one, many }) => ({
  user: one(users, {
    fields: [skpLog.userId],
    references: [users.id],
  }),
  rencanaKinerja: one(rencanaKinerja, {
    fields: [skpLog.rencanaKinerjaId],
    references: [rencanaKinerja.id],
  }),
  buktiDukung: many(buktiDukung),
}));

export const buktiDukungRelations = relations(buktiDukung, ({ one }) => ({
  skpLog: one(skpLog, {
    fields: [buktiDukung.skpLogId],
    references: [skpLog.id],
  }),
}));

export const perilakuBerakhlakRelations = relations(perilakuBerakhlak, ({ one, many }) => ({
  user: one(users, {
    fields: [perilakuBerakhlak.userId],
    references: [users.id],
  }),
  buktiDukung: many(buktiDukungBerakhlak),
}));

export const buktiDukungBerakhlakRelations = relations(buktiDukungBerakhlak, ({ one }) => ({
  perilakuBerakhlak: one(perilakuBerakhlak, {
    fields: [buktiDukungBerakhlak.perilakuBerakhlakId],
    references: [perilakuBerakhlak.id],
  }),
}));
