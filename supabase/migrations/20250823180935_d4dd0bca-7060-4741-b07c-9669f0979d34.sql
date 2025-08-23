-- Create records table for the data recorder app
CREATE TABLE public.records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (since no auth is implemented)
CREATE POLICY "Allow all operations on records" 
ON public.records 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_records_updated_at
  BEFORE UPDATE ON public.records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data
INSERT INTO public.records (title, description, category, event_date) VALUES
  ('Project Kickoff Meeting', 'Initial meeting to discuss project scope and timeline', 'Meeting', '2024-01-15'),
  ('Research Phase Completion', 'Completed user research and market analysis', 'Milestone', '2024-01-20'),
  ('Design Review', 'Review of initial design concepts and wireframes', 'Review', '2024-01-25'),
  ('Development Sprint 1', 'First development sprint - core functionality', 'Development', '2024-02-01'),
  ('User Testing Session', 'Conducted usability testing with 10 participants', 'Testing', '2024-02-10'),
  ('Bug Fix Release', 'Fixed critical bugs reported during testing', 'Release', '2024-02-15');