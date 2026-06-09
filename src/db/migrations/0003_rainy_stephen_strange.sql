ALTER TABLE `bukti_dukung_berakhlak` DROP FOREIGN KEY `bukti_dukung_berakhlak_perilaku_berakhlak_id_perilaku_berakhlak_id_fk`;
--> statement-breakpoint
ALTER TABLE `rencana_kinerja` ADD `tahun` varchar(10) DEFAULT '2024' NOT NULL;--> statement-breakpoint
ALTER TABLE `rencana_kinerja` ADD `indicator` text DEFAULT ('Laporan hasil kegiatan capaian kinerja.') NOT NULL;--> statement-breakpoint
ALTER TABLE `skp_log` ADD `output_count` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `skp_log` ADD `output_type` varchar(255) DEFAULT 'Dokumen' NOT NULL;--> statement-breakpoint
ALTER TABLE `bukti_dukung_berakhlak` ADD CONSTRAINT `fk_bukti_dukung_berakhlak_perilaku` FOREIGN KEY (`perilaku_berakhlak_id`) REFERENCES `perilaku_berakhlak`(`id`) ON DELETE cascade ON UPDATE no action;