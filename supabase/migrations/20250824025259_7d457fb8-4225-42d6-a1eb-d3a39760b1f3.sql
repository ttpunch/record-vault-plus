-- Add created_by column to records table and populate existing records
ALTER TABLE public.records 
ADD COLUMN created_by text DEFAULT (auth.uid())::text;

-- Update existing records to have a created_by value (using a default system user)
UPDATE public.records 
SET created_by = 'system' 
WHERE created_by IS NULL;

-- Make created_by required
ALTER TABLE public.records 
ALTER COLUMN created_by SET NOT NULL;

-- Add trigger to set created_by for new records
CREATE TRIGGER set_records_created_by
  BEFORE INSERT ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();