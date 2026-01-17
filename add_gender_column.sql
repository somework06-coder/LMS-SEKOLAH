-- Add gender column to teachers and students tables
-- Gender: 'L' = Laki-laki, 'P' = Perempuan

-- Add gender to teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS gender VARCHAR(1) CHECK (gender IN ('L', 'P'));

-- Add gender to students table  
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(1) CHECK (gender IN ('L', 'P'));

-- Optional: Add comments for clarity
COMMENT ON COLUMN teachers.gender IS 'Gender: L=Laki-laki, P=Perempuan';
COMMENT ON COLUMN students.gender IS 'Gender: L=Laki-laki, P=Perempuan';
