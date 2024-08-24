CREATE DATABASE TLDR_DB;
USE TLDR_DB;
CREATE TABLE `TLDR_MSTR_USER_TBL` (
  `user_id` int PRIMARY KEY AUTO_INCREMENT,
  `user_name` varchar(25),
  `created_by` varchar(25),
  `created_at` timestamp
);

CREATE TABLE `TLDR_MSTR_CONTENT_TBL` (
  `content_id` int PRIMARY KEY AUTO_INCREMENT,
  `user_id` int,
  `content_hash` char(128),
  `content_prefix` varchar(20),
  `created_at` timestamp
);

CREATE TABLE `TLDR_MSTR_CONTENT_CHUNK_TBL` (
  `content_chunk_id` bigint PRIMARY KEY AUTO_INCREMENT,
  `content_id` int,
  `user_id` int,
  `chunk_data` varchar(500),
  `chunk_vector` VECTOR(768) COMMENT "hnsw(distance=cosine)",
  `created_at` timestamp
);