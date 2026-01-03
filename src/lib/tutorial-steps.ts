export const TUTORIAL_PROJECT_ID = '8cc16d7d-848c-411b-b46b-ab6507a87578';

export interface TutorialStep {
  id: number;
  route: string;
  targetSelector: string;
  title: string;
  description: string;
  action?: 'click' | 'navigate';
  nextRoute?: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    route: '/dashboard',
    targetSelector: '[data-tutorial="new-project"]',
    title: 'Create Your First Project',
    description: 'Start by creating a new project to organize your NFT collection. Each project contains categories and layers.',
  },
  {
    id: 2,
    route: '/dashboard',
    targetSelector: '[data-tutorial="tutorial-project"]',
    title: 'Explore Example Project',
    description: 'This is a pre-made project showing how layers work. Click to explore!',
    action: 'click',
    nextRoute: `/project/${TUTORIAL_PROJECT_ID}`,
  },
  {
    id: 3,
    route: `/project/${TUTORIAL_PROJECT_ID}`,
    targetSelector: '[data-tutorial="layers-tab"]',
    title: 'Layer Organization',
    description: 'Layers are the building blocks of your NFT collection. They are organized into categories.',
  },
  {
    id: 4,
    route: `/project/${TUTORIAL_PROJECT_ID}`,
    targetSelector: '[data-tutorial="category-card"]',
    title: 'Categories & Traits',
    description: 'Categories represent traits like Background, Body, Eyes, etc. Each category contains multiple layer variations.',
  },
  {
    id: 5,
    route: `/project/${TUTORIAL_PROJECT_ID}`,
    targetSelector: '[data-tutorial="view-toggle"]',
    title: 'Visual Layer Editor',
    description: 'Toggle between List and Visual view. Visual mode shows layers as nodes where you can see and create connections between traits.',
  },
  {
    id: 6,
    route: `/project/${TUTORIAL_PROJECT_ID}`,
    targetSelector: '[data-tutorial="layer-item"]',
    title: 'Individual Layers',
    description: 'Each layer is a PNG image. The rarity weight affects how often it appears in generated NFTs.',
  },
  {
    id: 7,
    route: `/project/${TUTORIAL_PROJECT_ID}`,
    targetSelector: '[data-tutorial="generate-tab"]',
    title: 'Generation Engine',
    description: 'Combine your layers to create unique NFTs with proper metadata. Click the Generate tab to continue.',
    action: 'click',
    nextRoute: `/project/${TUTORIAL_PROJECT_ID}?tab=generate`,
  },
  {
    id: 8,
    route: `/project/${TUTORIAL_PROJECT_ID}?tab=generate`,
    targetSelector: '[data-tutorial="generation-controls"]',
    title: 'Generation Options',
    description: 'Choose single or batch generation. Customize metadata and generate unique combinations from your layers.',
  },
  {
    id: 9,
    route: `/project/${TUTORIAL_PROJECT_ID}?tab=generate`,
    targetSelector: '[data-tutorial="history-tab"]',
    title: 'Generation History',
    description: 'View all your generated NFTs here. Mark favorites, add comments, and download assets.',
    action: 'click',
    nextRoute: `/project/${TUTORIAL_PROJECT_ID}?tab=history`,
  },
  {
    id: 10,
    route: '/dashboard',
    targetSelector: '[data-tutorial="credits-display"]',
    title: 'Understanding Credits',
    description: 'Generation uses credits. Free accounts get 100 credits monthly. Check your balance anytime in your profile.',
  },
  {
    id: 11,
    route: '/dashboard',
    targetSelector: null as unknown as string,
    title: "You're Ready!",
    description: 'Tutorial complete! You now know the basics. Check the Documentation for advanced features like publishing and marketing.',
  },
];

export const getTotalSteps = () => TUTORIAL_STEPS.length;

export const getStepByNumber = (stepNumber: number): TutorialStep | undefined => {
  return TUTORIAL_STEPS.find(step => step.id === stepNumber);
};
