-- Create payment_summaries table
CREATE TABLE IF NOT EXISTS `payment_summaries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `institution_id` bigint unsigned NOT NULL,
  `session_id` bigint unsigned DEFAULT NULL,
  `fee_id` bigint unsigned DEFAULT NULL,
  `reserved` decimal(10,2) NOT NULL DEFAULT '0.00',
  `expected` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_received` decimal(10,2) NOT NULL DEFAULT '0.00',
  `debt` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount_applied` decimal(10,2) NOT NULL DEFAULT '0.00',
  `extra_applied` decimal(10,2) NOT NULL DEFAULT '0.00',
  `completed_count` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_summaries_institution_id_foreign` (`institution_id`),
  KEY `payment_summaries_session_id_foreign` (`session_id`),
  KEY `payment_summaries_fee_id_foreign` (`fee_id`),
  CONSTRAINT `payment_summaries_institution_id_foreign` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payment_summaries_session_id_foreign` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payment_summaries_fee_id_foreign` FOREIGN KEY (`fee_id`) REFERENCES `fees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mark the migration as run
INSERT IGNORE INTO migrations (migration, batch) VALUES
('2026_01_15_135514_create_fees_system_tables', 1);
