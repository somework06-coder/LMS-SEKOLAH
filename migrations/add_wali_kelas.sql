-- Migration: Add homeroom teacher (wali kelas) to classes
-- Run this in Supabase SQL Editor

-- Add homeroom_teacher_id column to classes table
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS homeroom_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_classes_homeroom_teacher ON classes(homeroom_teacher_id);
