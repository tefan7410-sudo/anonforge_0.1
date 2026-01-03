-- Add is_tutorial_template column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_tutorial_template boolean DEFAULT false;

-- Create tutorial_progress table
CREATE TABLE public.tutorial_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tutorial_enabled boolean DEFAULT false,
  current_step integer DEFAULT 0,
  completed_at timestamptz,
  skipped_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tutorial_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutorial_progress
CREATE POLICY "Users can view their own tutorial progress"
ON public.tutorial_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutorial progress"
ON public.tutorial_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutorial progress"
ON public.tutorial_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER update_tutorial_progress_updated_at
BEFORE UPDATE ON public.tutorial_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update the tutorial project
UPDATE public.projects 
SET 
  name = 'Tutorial Example Collection',
  description = 'A sample NFT collection to help you learn the platform. Explore categories, layers, and generation!',
  is_tutorial_template = true,
  is_public = true
WHERE id = '8cc16d7d-848c-411b-b46b-ab6507a87578';

-- RLS Policy for everyone to view tutorial template projects (read-only)
CREATE POLICY "Everyone can view tutorial template projects"
ON public.projects FOR SELECT
USING (is_tutorial_template = true);