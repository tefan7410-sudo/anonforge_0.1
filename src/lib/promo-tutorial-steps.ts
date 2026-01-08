export interface PromoTutorialStep {
  id: number;
  title: string;
  description: string;
  visual: 'project-creation' | 'layer-upload' | 'rarity-weights' | 'generation' | 'preview' | 'publish' | 'marketing' | 'cta';
  isFinal?: boolean;
}

export const PROMO_TUTORIAL_STEPS: PromoTutorialStep[] = [
  {
    id: 1,
    title: "Create Your Project",
    description: "Start with a name, description, and token prefix. It takes less than 30 seconds to set up your first NFT collection.",
    visual: "project-creation"
  },
  {
    id: 2,
    title: "Upload Your Layers",
    description: "Drag and drop your PNG files into categories like Background, Body, Eyes, and Accessories. Our system organizes everything automatically.",
    visual: "layer-upload"
  },
  {
    id: 3,
    title: "Set Rarity Weights",
    description: "Control how rare each trait is. Make legendary items appear in just 1% of NFTs, while common items show up in 50%.",
    visual: "rarity-weights"
  },
  {
    id: 4,
    title: "Generate Unique NFTs",
    description: "Our engine combines your layers into thousands of unique combinations automatically. Watch your collection come to life.",
    visual: "generation"
  },
  {
    id: 5,
    title: "Preview & Download",
    description: "Review your generated NFTs, mark favorites, add comments, and download complete with proper Cardano metadata.",
    visual: "preview"
  },
  {
    id: 6,
    title: "Publish & Sell",
    description: "Connect to NMKR for Cardano minting, set your price, and list your collection on our marketplace for the world to see.",
    visual: "publish"
  },
  {
    id: 7,
    title: "Market Your Collection",
    description: "Coming soon: Connect with other creators and put your project in front of new audiences. For now, market directly on AnonForge with featured spots and promotional tools.",
    visual: "marketing"
  },
  {
    id: 8,
    title: "Ready to Launch on AnonForge?",
    description: "Join hundreds of creators who have launched successful NFT collections on AnonForge. Start building your collection today.",
    visual: "cta",
    isFinal: true
  }
];

export const getTotalPromoSteps = () => PROMO_TUTORIAL_STEPS.length;

export const getPromoStepByNumber = (stepNumber: number): PromoTutorialStep | undefined => {
  return PROMO_TUTORIAL_STEPS.find(step => step.id === stepNumber);
};
