-- 1. Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Table to store PDF chunks with embeddings
CREATE TABLE IF NOT EXISTS material_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER,
    text_content TEXT NOT NULL,
    embedding vector(768), -- Gemini embedding dimension
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(material_id, chunk_index)
);

-- Index for vector similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS material_chunks_embedding_idx 
ON material_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for material lookup
CREATE INDEX IF NOT EXISTS material_chunks_material_id_idx 
ON material_chunks(material_id);

-- 3. Table to store chat history between students and AI
CREATE TABLE IF NOT EXISTS material_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    cited_chunks JSONB, -- Array of {chunk_id, page, excerpt}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for auto-cleanup (delete > 30 days)
CREATE INDEX IF NOT EXISTS material_chat_history_created_at_idx 
ON material_chat_history(created_at);

-- Index for fetching history per student per material
CREATE INDEX IF NOT EXISTS material_chat_history_lookup_idx 
ON material_chat_history(material_id, student_id, created_at DESC);

-- 4. PostgreSQL function for vector similarity search
CREATE OR REPLACE FUNCTION match_material_chunks(
    query_embedding vector(768),
    match_material_id uuid,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    text text,
    page integer,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        material_chunks.id,
        material_chunks.text_content AS text,
        material_chunks.page_number AS page,
        1 - (material_chunks.embedding <=> query_embedding) AS similarity
    FROM material_chunks
    WHERE material_chunks.material_id = match_material_id
    ORDER BY material_chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
