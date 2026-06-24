-- Insert migration records for already-run migrations
INSERT IGNORE INTO migrations (migration, batch) VALUES
('0001_01_01_000000_create_users_table', 1),
('0001_01_01_000001_create_cache_table', 1),
('0001_01_01_000002_create_jobs_table', 1),
('2026_01_15_135514_create_fees_system_tables', 1),
('2026_01_15_184038_create_bank_accounts_table', 1),
('2026_01_15_193215_create_transactions_table', 1);

-- Create fee_beneficiaries table
CREATE TABLE IF NOT EXISTS `fee_beneficiaries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `fee_id` bigint unsigned NOT NULL,
  `account_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fee_beneficiaries_fee_id_foreign` (`fee_id`),
  CONSTRAINT `fee_beneficiaries_fee_id_foreign` FOREIGN KEY (`fee_id`) REFERENCES `fees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mark the fee_beneficiaries migration as run
INSERT IGNORE INTO migrations (migration, batch) VALUES
('2026_01_17_141916_create_fee_beneficiaries_table', 1);
