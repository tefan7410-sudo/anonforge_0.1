import React from 'react';
import { TutorialProvider as TutorialContextProvider } from '@/contexts/TutorialContext';
import { TutorialHighlight } from './TutorialHighlight';
import { TutorialExitButton } from './TutorialExitButton';

interface TutorialProviderProps {
  children: React.ReactNode;
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  return (
    <TutorialContextProvider>
      {children}
      <TutorialHighlight />
      <TutorialExitButton />
    </TutorialContextProvider>
  );
};
