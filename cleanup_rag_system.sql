-- ===============================================
-- RAG SYSTEM CLEANUP SQL
-- Jalankan query ini di Supabase SQL Editor
-- ===============================================

-- 1. Drop function match_material_chunks (jika ada)
DROP FUNCTION IF EXISTS match_material_chunks(vector, float, int, uuid);

-- 2. Drop table material_chat_history (history chat AI)
DROP TABLE IF EXISTS material_chat_history;

-- 3. Drop table material_chunks (chunks PDF + embeddings)
DROP TABLE IF EXISTS material_chunks;

-- 4. Remove processing_status column from materials table
ALTER TABLE materials DROP COLUMN IF EXISTS processing_status;

-- 5. (Opsional) Delete vector extension jika tidak digunakan di tempat lain
-- PERINGATAN: Hanya jalankan jika tidak ada table lain yang menggunakan vector
-- DROP EXTENSION IF EXISTS vector;

-- ===============================================
-- VERIFIKASI
-- ===============================================
-- Jalankan query berikut untuk memastikan cleanup berhasil:

-- Cek apakah table material_chunks masih ada
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'material_chunks'
) AS material_chunks_exists;

-- Cek apakah table material_chat_history masih ada
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'material_chat_history'
) AS material_chat_history_exists;

-- Cek apakah column processing_status masih ada di materials
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' 
    AND column_name = 'processing_status'
) AS processing_status_column_exists;

-- Semua hasil harus FALSE setelah cleanup
