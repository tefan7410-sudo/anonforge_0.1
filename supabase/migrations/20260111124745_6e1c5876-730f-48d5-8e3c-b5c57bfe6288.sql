-- Create bug_reports table
CREATE TABLE public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  page_url TEXT,
  browser_info JSONB,
  console_logs JSONB,
  error_stack TEXT,
  user_actions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_bug_reports_user_id ON public.bug_reports(user_id);
CREATE INDEX idx_bug_reports_status ON public.bug_reports(status);
CREATE INDEX idx_bug_reports_created_at ON public.bug_reports(created_at DESC);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can create bug reports
CREATE POLICY "Users can create bug reports" 
  ON public.bug_reports FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own bug reports
CREATE POLICY "Users can view their own bug reports" 
  ON public.bug_reports FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- Admins/owners can view all bug reports
CREATE POLICY "Admins can view all bug reports" 
  ON public.bug_reports FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Admins/owners can update bug reports
CREATE POLICY "Admins can update bug reports" 
  ON public.bug_reports FOR UPDATE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Create trigger for updated_at
CREATE TRIGGER update_bug_reports_updated_at
  BEFORE UPDATE ON public.bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for bug screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bug-screenshots', 'bug-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for bug screenshots
CREATE POLICY "Users can upload bug screenshots"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bug-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view bug screenshots"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'bug-screenshots');

CREATE POLICY "Users can delete their own bug screenshots"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'bug-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);