CREATE TABLE public.scan_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('image', 'environment')),
  file_name TEXT,
  environment_data JSONB,
  damage_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  area_affected NUMERIC NOT NULL,
  description TEXT NOT NULL,
  recommendations TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scans"
ON public.scan_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
ON public.scan_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans"
ON public.scan_history FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX idx_scan_history_created_at ON public.scan_history(created_at DESC);