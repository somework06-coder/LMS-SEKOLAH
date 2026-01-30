-- Migration: Add grade_level to classes table
-- Date: 2026-01-30
-- Description: Add grade_level column to support grouping classes by level (1, 2, 3)

-- Step 1: Add column
ALTER TABLE classes ADD COLUMN grade_level INTEGER;

-- Step 2: Add comment
COMMENT ON COLUMN classes.grade_level IS 'Class grade level: 1, 2, or 3 (e.g., SMP: 1=Kelas 7, 2=Kelas 8, 3=Kelas 9)';

-- Step 3: Create index for better query performance
CREATE INDEX idx_classes_grade_level ON classes(grade_level);

-- Step 4: Optional - Update existing data based on class name patterns
-- Uncomment and modify as needed:

-- For SMP (Grade 7, 8, 9)
-- UPDATE classes SET grade_level = 1 WHERE name LIKE '%7%' OR name ILIKE '%VII%';
-- UPDATE classes SET grade_level = 2 WHERE name LIKE '%8%' OR name ILIKE '%VIII%';
-- UPDATE classes SET grade_level = 3 WHERE name LIKE '%9%' OR name ILIKE '%IX%';

-- For SMA (Grade 10, 11, 12)
-- UPDATE classes SET grade_level = 1 WHERE name LIKE '%10%' OR name ILIKE '%X %';
-- UPDATE classes SET grade_level = 2 WHERE name LIKE '%11%' OR name ILIKE '%XI%';
-- UPDATE classes SET grade_level = 3 WHERE name LIKE '%12%' OR name ILIKE '%XII%';

-- Note: Run the UPDATE queries manually after reviewing your class names
-- Or set grade_level manually through the admin UI
