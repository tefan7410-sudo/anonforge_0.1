import { useEffect, useRef, useState, useMemo } from 'react';

// Check for reduced motion preference and mobile devices
const getAnimationPreference = () => {
  if (typeof window === 'undefined') return { prefersReducedMotion: false, isMobile: false };
  
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  
  return { prefersReducedMotion, isMobile };
};

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  // Skip animation entirely on mobile for performance
  skipOnMobile?: boolean;
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
  triggerOnce = true,
  skipOnMobile = true,
}: UseScrollAnimationOptions = {}) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Memoize animation preference check
  const animationPrefs = useMemo(() => getAnimationPreference(), []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Skip observer entirely on mobile or when reduced motion is preferred
    if (skipOnMobile && (animationPrefs.isMobile || animationPrefs.prefersReducedMotion)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, skipOnMobile, animationPrefs]);

  return { ref, isVisible };
}

// Hook for staggered animations on child elements
export function useStaggerAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
) {
  const { ref, isVisible } = useScrollAnimation<T>(options);
  
  return {
    ref,
    isVisible,
    getStaggerDelay: (index: number, baseDelay = 100) => ({
      animationDelay: `${index * baseDelay}ms`,
    }),
  };
}
