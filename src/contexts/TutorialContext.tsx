import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTutorialProgress, TUTORIAL_STEPS, getTotalSteps, TUTORIAL_PROJECT_ID } from '@/hooks/use-tutorial';
import { TutorialStep } from '@/lib/tutorial-steps';

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  currentStepData: TutorialStep | null;
  totalSteps: number;
  isCompleted: boolean;
  isSkipped: boolean;
  hasSeenPrompt: boolean;
  loading: boolean;
  startTutorial: () => Promise<void>;
  nextStep: () => Promise<void>;
  previousStep: () => Promise<void>;
  skipTutorial: () => Promise<void>;
  restartTutorial: () => Promise<void>;
  goToStep: (step: number) => Promise<void>;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    progress,
    loading,
    isActive,
    currentStep,
    isCompleted,
    isSkipped,
    hasSeenTutorialPrompt,
    startTutorial: startTutorialProgress,
    updateStep,
    skipTutorial: skipTutorialProgress,
    restartTutorial: restartTutorialProgress,
  } = useTutorialProgress();

  const [currentStepData, setCurrentStepData] = useState<TutorialStep | null>(null);

  useEffect(() => {
    if (isActive && currentStep > 0) {
      const stepData = TUTORIAL_STEPS.find(s => s.id === currentStep);
      setCurrentStepData(stepData || null);
    } else {
      setCurrentStepData(null);
    }
  }, [isActive, currentStep]);

  const startTutorial = useCallback(async () => {
    await startTutorialProgress();
    navigate('/dashboard');
  }, [startTutorialProgress, navigate]);

  const nextStep = useCallback(async () => {
    const nextStepNumber = currentStep + 1;
    
    if (nextStepNumber > getTotalSteps()) {
      await updateStep(nextStepNumber);
      navigate('/dashboard');
      return;
    }

    const nextStepData = TUTORIAL_STEPS.find(s => s.id === nextStepNumber);
    await updateStep(nextStepNumber);

    if (nextStepData && nextStepData.route !== location.pathname) {
      navigate(nextStepData.route);
    }
  }, [currentStep, updateStep, navigate, location.pathname]);

  const previousStep = useCallback(async () => {
    if (currentStep <= 1) return;
    
    const prevStepNumber = currentStep - 1;
    const prevStepData = TUTORIAL_STEPS.find(s => s.id === prevStepNumber);
    
    await updateStep(prevStepNumber);

    if (prevStepData && prevStepData.route !== location.pathname) {
      navigate(prevStepData.route);
    }
  }, [currentStep, updateStep, navigate, location.pathname]);

  const skipTutorial = useCallback(async () => {
    await skipTutorialProgress();
    navigate('/dashboard');
  }, [skipTutorialProgress, navigate]);

  const restartTutorial = useCallback(async () => {
    await restartTutorialProgress();
    navigate('/dashboard');
  }, [restartTutorialProgress, navigate]);

  const goToStep = useCallback(async (step: number) => {
    if (step < 1 || step > getTotalSteps()) return;
    
    const stepData = TUTORIAL_STEPS.find(s => s.id === step);
    await updateStep(step);

    if (stepData && stepData.route !== location.pathname) {
      navigate(stepData.route);
    }
  }, [updateStep, navigate, location.pathname]);

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        currentStepData,
        totalSteps: getTotalSteps(),
        isCompleted,
        isSkipped,
        hasSeenPrompt: hasSeenTutorialPrompt,
        loading,
        startTutorial,
        nextStep,
        previousStep,
        skipTutorial,
        restartTutorial,
        goToStep,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};
