import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TUTORIAL_PROJECT_ID, TUTORIAL_STEPS, getTotalSteps } from '@/lib/tutorial-steps';

interface TutorialProgress {
  id: string;
  user_id: string;
  tutorial_enabled: boolean;
  current_step: number;
  completed_at: string | null;
  skipped_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useTutorialProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<TutorialProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setProgress(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tutorial_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProgress(data);
    } catch (err) {
      console.error('Error fetching tutorial progress:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const startTutorial = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tutorial_progress')
        .upsert({
          user_id: user.id,
          tutorial_enabled: true,
          current_step: 1,
          completed_at: null,
          skipped_at: null,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      setProgress(data);
      return data;
    } catch (err) {
      console.error('Error starting tutorial:', err);
    }
  };

  const updateStep = async (step: number) => {
    if (!user || !progress) return;

    try {
      const isComplete = step > getTotalSteps();
      const { data, error } = await supabase
        .from('tutorial_progress')
        .update({
          current_step: isComplete ? getTotalSteps() : step,
          completed_at: isComplete ? new Date().toISOString() : null,
          tutorial_enabled: !isComplete,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProgress(data);
      return data;
    } catch (err) {
      console.error('Error updating tutorial step:', err);
    }
  };

  const skipTutorial = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tutorial_progress')
        .upsert({
          user_id: user.id,
          tutorial_enabled: false,
          skipped_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      setProgress(data);
      return data;
    } catch (err) {
      console.error('Error skipping tutorial:', err);
    }
  };

  const restartTutorial = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tutorial_progress')
        .upsert({
          user_id: user.id,
          tutorial_enabled: true,
          current_step: 1,
          completed_at: null,
          skipped_at: null,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      setProgress(data);
      return data;
    } catch (err) {
      console.error('Error restarting tutorial:', err);
    }
  };

  return {
    progress,
    loading,
    isActive: progress?.tutorial_enabled && !progress?.completed_at && !progress?.skipped_at,
    currentStep: progress?.current_step || 0,
    isCompleted: !!progress?.completed_at,
    isSkipped: !!progress?.skipped_at,
    hasSeenTutorialPrompt: !!progress,
    startTutorial,
    updateStep,
    skipTutorial,
    restartTutorial,
    refetch: fetchProgress,
  };
};

export const useTutorialProject = () => {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', TUTORIAL_PROJECT_ID)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (err) {
        console.error('Error fetching tutorial project:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, []);

  return { project, loading };
};

export const isTutorialProject = (projectId: string) => {
  return projectId === TUTORIAL_PROJECT_ID;
};

export { TUTORIAL_PROJECT_ID, TUTORIAL_STEPS, getTotalSteps };
