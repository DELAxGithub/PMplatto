/*
  # Add PR fields to platto_programs table
  
  Add missing pr_completed and pr_due_date fields to align schema
  with existing project requirements.
*/

-- Add pr_completed and pr_due_date fields if they don't exist
DO $$ 
BEGIN
  -- Add pr_completed field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'platto_programs' 
                AND column_name = 'pr_completed') THEN
    ALTER TABLE platto_programs ADD COLUMN pr_completed boolean DEFAULT false;
  END IF;

  -- Add pr_due_date field  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'platto_programs' 
                AND column_name = 'pr_due_date') THEN
    ALTER TABLE platto_programs ADD COLUMN pr_due_date date;
  END IF;
END $$;