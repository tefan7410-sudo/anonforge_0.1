import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/contexts/AuthContext';
import { TUTORIAL_PROJECT_ID, TUTORIAL_STEPS, getTotalSteps } from '@/lib/tutorial-steps';
import { useProject } from './use-project';

export interface TutorialProgress {
  _id: string;
  id?: string;
  user_id: string;
  tutorial_enabled: boolean;
  current_step: number;
  completed_at?: string;
  skipped_at?: string;
  updated_at?: string;
  _creationTime: number;
}

export const useTutorialProgress = () => {
  const { user } = useAuth();
  const progress = useQuery(
    api.tutorials.getProgress,
    user?.id ? {} : "skip"
  );

  const startTutorial = useMutation(api.tutorials.startTutorial);
  const updateStep = useMutation(api.tutorials.updateProgress);
  const skipTutorial = useMutation(api.tutorials.skipTutorial);
  const resetProgress = useMutation(api.tutorials.resetProgress);

  return {
    progress: progress as TutorialProgress | null | undefined,
    loading: progress === undefined,
    isActive: progress?.tutorial_enabled && !progress?.completed_at && !progress?.skipped_at,
    currentStep: progress?.current_step || 0,
    isCompleted: !!progress?.completed_at,
    isSkipped: !!progress?.skipped_at,
    hasSeenTutorialPrompt: !!progress,
    startTutorial: async () => {
      await startTutorial({});
    },
    updateStep: async (step: number) => {
      const isComplete = step > getTotalSteps();
      await updateStep({
        currentStep: isComplete ? getTotalSteps() : step,
        tutorialEnabled: !isComplete,
        completedAt: isComplete ? new Date().toISOString() : undefined,
      });
    },
    skipTutorial: async () => {
      await skipTutorial({});
    },
    restartTutorial: async () => {
      await resetProgress({});
    },
    refetch: () => {},
  };
};

export const useTutorialProject = () => {
  const { project, isLoading } = useProject(TUTORIAL_PROJECT_ID);

  return { project, loading: isLoading };
};

export const isTutorialProject = (projectId: string) => {
  return projectId === TUTORIAL_PROJECT_ID;
};

export { TUTORIAL_PROJECT_ID, TUTORIAL_STEPS, getTotalSteps };
