-- Create audit trail table to track all changes
CREATE TABLE IF NOT EXISTS public.audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id TEXT NOT NULL DEFAULT auth.uid()::text,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

-- Create policies for audit trail
CREATE POLICY "Users can view own audit trail" 
ON public.audit_trail 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "System can insert audit trail" 
ON public.audit_trail 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_trail_table_name ON public.audit_trail(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_trail_record_id ON public.audit_trail(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON public.audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON public.audit_trail(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON public.audit_trail(action);

-- Grant permissions
GRANT ALL ON public.audit_trail TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Function to get changed fields between old and new data
CREATE OR REPLACE FUNCTION public.get_changed_fields(old_data JSONB, new_data JSONB)
RETURNS TEXT[] AS $$
DECLARE
  changed_fields TEXT[] := '{}';
  key TEXT;
  old_value JSONB;
  new_value JSONB;
BEGIN
  -- Check for deleted fields (in old but not in new)
  FOR key IN SELECT jsonb_object_keys(old_data)
  LOOP
    IF NOT (new_data ? key) THEN
      changed_fields := array_append(changed_fields, key);
    END IF;
  END LOOP;
  
  -- Check for added or modified fields
  FOR key IN SELECT jsonb_object_keys(new_data)
  LOOP
    old_value := old_data->key;
    new_value := new_data->key;
    
    IF old_value IS DISTINCT FROM new_value THEN
      changed_fields := array_append(changed_fields, key);
    END IF;
  END LOOP;
  
  RETURN changed_fields;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit trail entry
CREATE OR REPLACE FUNCTION public.create_audit_entry(
  p_table_name TEXT,
  p_record_id UUID,
  p_action TEXT,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  changed_fields TEXT[];
BEGIN
  -- Get changed fields if this is an update
  IF p_action = 'UPDATE' AND p_old_data IS NOT NULL AND p_new_data IS NOT NULL THEN
    changed_fields := public.get_changed_fields(p_old_data, p_new_data);
  END IF;
  
  -- Insert audit trail entry
  INSERT INTO public.audit_trail (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_fields,
    user_id
  ) VALUES (
    p_table_name,
    p_record_id,
    p_action,
    p_old_data,
    p_new_data,
    changed_fields,
    auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql;

-- Create triggers for records table
CREATE OR REPLACE FUNCTION public.audit_records_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_audit_entry(
      'records',
      NEW.id,
      'INSERT',
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.create_audit_entry(
      'records',
      NEW.id,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.create_audit_entry(
      'records',
      OLD.id,
      'DELETE',
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS audit_records_trigger ON public.records;

-- Create trigger for records table
CREATE TRIGGER audit_records_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.records
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_records_trigger();

-- Create triggers for reminders table
CREATE OR REPLACE FUNCTION public.audit_reminders_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_audit_entry(
      'reminders',
      NEW.id,
      'INSERT',
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.create_audit_entry(
      'reminders',
      NEW.id,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.create_audit_entry(
      'reminders',
      OLD.id,
      'DELETE',
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS audit_reminders_trigger ON public.reminders;

-- Create trigger for reminders table
CREATE TRIGGER audit_reminders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_reminders_trigger();
