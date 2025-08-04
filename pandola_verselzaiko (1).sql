-- phpMyAdmin SQL Dump
-- version 5.2.1-1.el8.remi
-- https://www.phpmyadmin.net/
--
-- ホスト: localhost
-- 生成日時: 2025 年 8 月 02 日 05:58
-- サーバのバージョン： 10.5.22-MariaDB-log
-- PHP のバージョン: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- データベース: `pandola_verselzaiko`
--

-- --------------------------------------------------------

--
-- テーブルの構造 `categories`
--

CREATE TABLE `categories` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `parent_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `categories`
--

INSERT INTO `categories` (`id`, `name`, `parent_id`, `created_at`, `updated_at`) VALUES
('cat_688af0b2de588', 'カラー', NULL, '2025-07-31 04:27:30', '2025-07-31 04:27:30'),
('cat_688af5c1103fa', 'Aujua', NULL, '2025-07-31 04:49:05', '2025-07-31 04:49:05'),
('cat_688af68adaee2', 'Aujua', NULL, '2025-07-31 04:52:26', '2025-07-31 04:52:26'),
('cat_688af90786a2a', 'Aujua', NULL, '2025-07-31 05:03:03', '2025-07-31 05:03:03'),
('cat_688c08d5b5219', 'パーマ', NULL, '2025-08-01 00:22:45', '2025-08-01 00:22:45'),
('cat_688d21154c749', 'トリートメント', NULL, '2025-08-01 20:18:29', '2025-08-01 20:18:29');

-- --------------------------------------------------------

--
-- テーブルの構造 `company_info`
--

CREATE TABLE `company_info` (
  `id` varchar(255) NOT NULL DEFAULT 'main',
  `name` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `fax` varchar(50) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `representative_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `company_info`
--

INSERT INTO `company_info` (`id`, `name`, `address`, `phone`, `fax`, `website`, `representative_name`, `created_at`, `updated_at`) VALUES
('main', '有限会社XINGFU', '東京都渋谷区...', '03-1234-5678', '', '', '', '2025-07-31 00:00:35', '2025-08-01 20:23:08');

-- --------------------------------------------------------

--
-- テーブルの構造 `inventory_records`
--

CREATE TABLE `inventory_records` (
  `id` varchar(50) NOT NULL,
  `product_id` varchar(255) NOT NULL,
  `store_id` varchar(255) NOT NULL,
  `current_stock` int(11) NOT NULL DEFAULT 0,
  `minimum_stock` int(11) NOT NULL DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `logs`
--

CREATE TABLE `logs` (
  `id` int(11) NOT NULL,
  `action` text NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `logs`
--

INSERT INTO `logs` (`id`, `action`, `user_id`, `timestamp`, `created_at`) VALUES
(1, 'カテゴリ カラー を新規追加', 'ukki629', '2025-07-30 19:27:31', '2025-07-31 04:27:31'),
(2, 'カテゴリ パーマ を新規追加', 'ukki629', '2025-07-30 19:27:46', '2025-07-31 04:27:46'),
(3, 'カテゴリ Aujua を新規追加', 'ukki629', '2025-07-30 19:29:56', '2025-07-31 04:29:56'),
(4, 'カテゴリ Aujua を新規追加', 'ukki629', '2025-07-30 19:48:33', '2025-07-31 04:48:33'),
(5, 'カテゴリ Aujua を新規追加', 'ukki629', '2025-07-30 19:49:05', '2025-07-31 04:49:05'),
(6, 'カテゴリ Aujua を新規追加', 'ukki629', '2025-07-30 19:52:26', '2025-07-31 04:52:26'),
(7, 'カテゴリ Aujua を新規追加', 'ukki629', '2025-07-30 20:03:03', '2025-07-31 05:03:03'),
(8, 'カテゴリ パーマ を新規追加', 'ukki629', '2025-07-31 15:22:45', '2025-08-01 00:22:45'),
(9, '店舗 寿町店 を新規追加', 'ukki629', '2025-07-31 16:43:03', '2025-08-01 01:43:03'),
(10, '会社情報を更新しました', 'ukki629', '2025-08-01 11:23:08', '2025-08-01 20:23:08');

-- --------------------------------------------------------

--
-- テーブルの構造 `outbound_logs`
--

CREATE TABLE `outbound_logs` (
  `id` varchar(50) NOT NULL,
  `product_id` varchar(255) NOT NULL,
  `store_id` varchar(255) NOT NULL,
  `operator_id` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `products`
--

CREATE TABLE `products` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `barcode` varchar(255) NOT NULL,
  `category_id` varchar(255) NOT NULL,
  `cost_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `supplier_id` varchar(255) NOT NULL,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` varchar(255) NOT NULL,
  `order_date` date NOT NULL,
  `supplier_id` varchar(255) NOT NULL,
  `supplier_name` varchar(255) NOT NULL,
  `store_id` varchar(255) NOT NULL,
  `status` varchar(50) NOT NULL,
  `created_by_id` varchar(255) NOT NULL,
  `completed_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `purchase_order_items`
--

CREATE TABLE `purchase_order_items` (
  `id` int(11) NOT NULL,
  `purchase_order_id` varchar(255) NOT NULL,
  `product_id` varchar(255) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `barcode` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `cost_price_at_order` decimal(10,2) DEFAULT NULL,
  `is_received` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `scheduled_intake_items`
--

CREATE TABLE `scheduled_intake_items` (
  `id` varchar(255) NOT NULL,
  `product_id` varchar(255) NOT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price_per_unit` decimal(10,2) DEFAULT NULL,
  `cost_price_at_intake` decimal(10,2) DEFAULT NULL,
  `status` enum('PENDING_APPROVAL','APPROVED','RECEIVED','MANUAL_CHECK_NEEDED','REJECTED') NOT NULL DEFAULT 'PENDING_APPROVAL',
  `supplier_id` varchar(255) NOT NULL,
  `supplier_name` varchar(255) NOT NULL,
  `store_id` varchar(255) NOT NULL,
  `estimated_arrival_date` date DEFAULT NULL,
  `received_date` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `invoice_reference` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `stores`
--

CREATE TABLE `stores` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `stores`
--

INSERT INTO `stores` (`id`, `name`, `address`, `phone`, `created_at`, `updated_at`) VALUES
('store_101', '本店', '神奈川県秦野市元町5-12', '0463816807', '2025-07-29 05:33:11', '2025-07-29 05:33:11'),
('store_688c1ba6dba3e', '寿町店', '神奈川県秦野市寿町4-11', '0463841692', '2025-08-01 01:43:02', '2025-08-01 01:43:02');

-- --------------------------------------------------------

--
-- テーブルの構造 `suppliers`
--

CREATE TABLE `suppliers` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `line_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `phone`, `email`, `address`, `line_id`, `created_at`, `updated_at`) VALUES
('supp_2', 'mitui', '担当者B', '03-3333-4444', NULL, NULL, NULL, '2025-07-31 00:00:34', '2025-07-31 00:00:34');

-- --------------------------------------------------------

--
-- テーブルの構造 `users`
--

CREATE TABLE `users` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('ADMIN','STAFF') NOT NULL DEFAULT 'STAFF',
  `store_id` varchar(255) DEFAULT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `users`
--

INSERT INTO `users` (`id`, `name`, `role`, `store_id`, `hashed_password`, `created_at`, `updated_at`) VALUES
('1', 'admin', 'ADMIN', 'store_101', '$2y$10$42cbPLT8wCYWlIz/WbrR3.dnU73qvQHurBHSDpGSIzXC7NHg29f56', '2025-07-29 05:16:39', '2025-07-29 19:18:44'),
('2', 'test', 'ADMIN', 'store_101', '$2y$10$WC5i9/nTBdq8jZHxSmv8jeNsvJDPU16kd5aYtXmpdAAJH1N0k.Kaq', '2025-07-29 18:29:04', '2025-07-29 19:41:51'),
('ukki629', 'ukki629', 'ADMIN', 'store_101', '$2y$10$BbHjBD0XeLW81L.gKG8rIumdozubk4KoB9b3rBUfoyEvgip17m2oK', '2025-07-29 17:50:22', '2025-07-29 19:42:44'),
('user_688aeedcb5c99', 'yuri', 'STAFF', NULL, '$2y$10$2VA1hrgJK66RBzWc8RQdYeoxdQm6kP9ihWZGtOc99J8StFBNq0G4W', '2025-07-31 04:19:40', '2025-07-31 04:19:40');

--
-- ダンプしたテーブルのインデックス
--

--
-- テーブルのインデックス `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_id` (`parent_id`);

--
-- テーブルのインデックス `company_info`
--
ALTER TABLE `company_info`
  ADD PRIMARY KEY (`id`);

--
-- テーブルのインデックス `inventory_records`
--
ALTER TABLE `inventory_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_product_store` (`product_id`,`store_id`),
  ADD KEY `store_id` (`store_id`);

--
-- テーブルのインデックス `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`);

--
-- テーブルのインデックス `outbound_logs`
--
ALTER TABLE `outbound_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `store_id` (`store_id`),
  ADD KEY `outbound_logs_ibfk_3` (`operator_id`);

--
-- テーブルのインデックス `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `barcode` (`barcode`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `supplier_id` (`supplier_id`);

--
-- テーブルのインデックス `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `store_id` (`store_id`),
  ADD KEY `created_by_id` (`created_by_id`);

--
-- テーブルのインデックス `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_order_id` (`purchase_order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- テーブルのインデックス `scheduled_intake_items`
--
ALTER TABLE `scheduled_intake_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `store_id` (`store_id`);

--
-- テーブルのインデックス `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`id`);

--
-- テーブルのインデックス `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- テーブルのインデックス `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

--
-- ダンプしたテーブルの AUTO_INCREMENT
--

--
-- テーブルの AUTO_INCREMENT `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- テーブルの AUTO_INCREMENT `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- ダンプしたテーブルの制約
--

--
-- テーブルの制約 `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- テーブルの制約 `inventory_records`
--
ALTER TABLE `inventory_records`
  ADD CONSTRAINT `inventory_records_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_records_ibfk_2` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- テーブルの制約 `outbound_logs`
--
ALTER TABLE `outbound_logs`
  ADD CONSTRAINT `outbound_logs_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `outbound_logs_ibfk_2` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `outbound_logs_ibfk_3` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- テーブルの制約 `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE;

--
-- テーブルの制約 `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_orders_ibfk_2` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_orders_ibfk_3` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- テーブルの制約 `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `purchase_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- テーブルの制約 `scheduled_intake_items`
--
ALTER TABLE `scheduled_intake_items`
  ADD CONSTRAINT `scheduled_intake_items_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `scheduled_intake_items_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `scheduled_intake_items_ibfk_3` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON UPDATE CASCADE;

--
-- テーブルの制約 `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
