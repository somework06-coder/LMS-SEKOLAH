-- PostgreSQL function for vector similarity search
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
