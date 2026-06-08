CREATE TABLE `bukti_dukung` (
	`id` varchar(36) NOT NULL,
	`url` text NOT NULL,
	`nama_file` text,
	`skp_log_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bukti_dukung_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bukti_dukung_berakhlak` (
	`id` varchar(36) NOT NULL,
	`url` text NOT NULL,
	`nama_file` text,
	`perilaku_berakhlak_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bukti_dukung_berakhlak_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `perilaku_berakhlak` (
	`id` varchar(36) NOT NULL,
	`tanggal` timestamp NOT NULL DEFAULT (now()),
	`aspek` enum('BERORIENTASI_PELAYANAN','AKUNTABEL','KOMPETEN','HARMONIS','LOYAL','ADAPTIF','KOLABORATIF') NOT NULL,
	`wujud_perbuatan` text NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `perilaku_berakhlak_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rencana_kinerja` (
	`id` varchar(36) NOT NULL,
	`deskripsi` text NOT NULL,
	`kategori` enum('UTAMA','TAMBAHAN') NOT NULL DEFAULT 'UTAMA',
	`user_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rencana_kinerja_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skp_log` (
	`id` varchar(36) NOT NULL,
	`tanggal` timestamp NOT NULL DEFAULT (now()),
	`kegiatan` text NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`rencana_kinerja_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skp_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`nama` text NOT NULL,
	`email` varchar(255) NOT NULL,
	`image` text,
	`password` text,
	`nip` varchar(50),
	`jabatan` text,
	`seksi` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_nip_unique` UNIQUE(`nip`)
);
--> statement-breakpoint
ALTER TABLE `bukti_dukung` ADD CONSTRAINT `bukti_dukung_skp_log_id_skp_log_id_fk` FOREIGN KEY (`skp_log_id`) REFERENCES `skp_log`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bukti_dukung_berakhlak` ADD CONSTRAINT `bukti_dukung_berakhlak_perilaku_berakhlak_id_perilaku_berakhlak_id_fk` FOREIGN KEY (`perilaku_berakhlak_id`) REFERENCES `perilaku_berakhlak`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `perilaku_berakhlak` ADD CONSTRAINT `perilaku_berakhlak_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rencana_kinerja` ADD CONSTRAINT `rencana_kinerja_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skp_log` ADD CONSTRAINT `skp_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skp_log` ADD CONSTRAINT `skp_log_rencana_kinerja_id_rencana_kinerja_id_fk` FOREIGN KEY (`rencana_kinerja_id`) REFERENCES `rencana_kinerja`(`id`) ON DELETE cascade ON UPDATE no action;