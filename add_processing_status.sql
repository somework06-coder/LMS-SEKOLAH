-- Add processing_status to materials table
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending'; -- pending, processing, completed, failed

-- Update existing records
UPDATE materials 
SET processing_status = 'completed' 
WHERE type = 'PDF' AND EXISTS (SELECT 1 FROM material_chunks WHERE material_id = materials.id);

UPDATE materials
SET processing_status = 'failed'
WHERE type = 'PDF' AND processing_status = 'pending' AND created_at < NOW() - INTERVAL '1 hour';
