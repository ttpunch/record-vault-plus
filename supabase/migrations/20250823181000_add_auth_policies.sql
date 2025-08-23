-- Drop the existing policy that allows all operations
DROP POLICY IF EXISTS "Allow all operations on records" ON public.records;

-- Create policy to only allow users to see their own records
CREATE POLICY "Users can view own records" 
ON public.records 
FOR SELECT 
USING (auth.uid()::text = created_by);

-- Create policy to only allow users to insert their own records
CREATE POLICY "Users can insert own records" 
ON public.records 
FOR INSERT 
WITH CHECK (auth.uid()::text = created_by);

-- Create policy to only allow users to update their own records
CREATE POLICY "Users can update own records" 
ON public.records 
FOR UPDATE 
USING (auth.uid()::text = created_by)
WITH CHECK (auth.uid()::text = created_by);

-- Create policy to only allow users to delete their own records
CREATE POLICY "Users can delete own records" 
ON public.records 
FOR DELETE 
USING (auth.uid()::text = created_by);

-- Add created_by column to track which user created each record
ALTER TABLE public.records 
ADD COLUMN created_by TEXT NOT NULL DEFAULT auth.uid()::text;

-- Create trigger to automatically set created_by on insert
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid()::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_records_created_by
  BEFORE INSERT ON public.records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by();
