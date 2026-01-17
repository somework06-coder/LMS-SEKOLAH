-- Add image_url column to question tables
-- This allows teachers to attach images to questions

-- Add to quiz_questions
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add to exam_questions  
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add to question_bank
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comments for clarity
COMMENT ON COLUMN quiz_questions.image_url IS 'URL to question image stored in Supabase Storage';
COMMENT ON COLUMN exam_questions.image_url IS 'URL to question image stored in Supabase Storage';
COMMENT ON COLUMN question_bank.image_url IS 'URL to question image stored in Supabase Storage';
