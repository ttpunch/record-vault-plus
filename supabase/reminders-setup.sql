-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_date DATE NOT NULL,
  reminder_time TIME NOT NULL,
  time_limit TEXT NOT NULL,
  actions TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL DEFAULT auth.uid()::text
);

-- Enable Row Level Security
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can insert own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON public.reminders;

-- Create policies for reminders
CREATE POLICY "Users can view own reminders" 
ON public.reminders 
FOR SELECT 
USING (auth.uid()::text = created_by);

CREATE POLICY "Users can insert own reminders" 
ON public.reminders 
FOR INSERT 
WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Users can update own reminders" 
ON public.reminders 
FOR UPDATE 
USING (auth.uid()::text = created_by)
WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Users can delete own reminders" 
ON public.reminders 
FOR DELETE 
USING (auth.uid()::text = created_by);

-- Create or replace function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to set created_by
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid()::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_reminders_updated_at ON public.reminders;
DROP TRIGGER IF EXISTS set_reminders_created_by ON public.reminders;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically set created_by on insert
CREATE TRIGGER set_reminders_created_by
  BEFORE INSERT ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by();

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_reminders_record_id;
DROP INDEX IF EXISTS idx_reminders_reminder_date;
DROP INDEX IF EXISTS idx_reminders_is_active;
DROP INDEX IF EXISTS idx_reminders_created_by;

-- Create indexes for better performance
CREATE INDEX idx_reminders_record_id ON public.reminders(record_id);
CREATE INDEX idx_reminders_reminder_date ON public.reminders(reminder_date);
CREATE INDEX idx_reminders_is_active ON public.reminders(is_active);
CREATE INDEX idx_reminders_created_by ON public.reminders(created_by);

-- Grant necessary permissions
GRANT ALL ON public.reminders TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
