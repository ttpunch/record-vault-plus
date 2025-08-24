-- Temporarily disable audit triggers to prevent null user_id issues
DROP TRIGGER IF EXISTS records_audit_trigger ON public.records;
DROP TRIGGER IF EXISTS reminders_audit_trigger ON public.reminders;

-- Add created_by column to records table and populate existing records
ALTER TABLE public.records 
ADD COLUMN IF NOT EXISTS created_by text DEFAULT 'system';

-- Update existing records to have a created_by value
UPDATE public.records 
SET created_by = 'system' 
WHERE created_by IS NULL;

-- Make created_by required
ALTER TABLE public.records 
ALTER COLUMN created_by SET NOT NULL;

-- Add trigger to set created_by for new records
DROP TRIGGER IF EXISTS set_records_created_by ON public.records;
CREATE TRIGGER set_records_created_by
  BEFORE INSERT ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- Re-enable audit triggers now that schema is correct
CREATE TRIGGER records_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.records
  FOR EACH ROW EXECUTE FUNCTION public.audit_records_trigger();

CREATE TRIGGER reminders_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.audit_reminders_trigger();