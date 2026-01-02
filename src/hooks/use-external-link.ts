import { useState, useCallback, useEffect } from 'react';

const SESSION_KEY = 'external-link-warning-dismissed';

export function useExternalLink() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Check session storage on mount
  useEffect(() => {
    const dismissed = sessionStorage.getItem(SESSION_KEY);
    if (dismissed === 'true') {
      setDontShowAgain(true);
    }
  }, []);

  const handleExternalClick = useCallback((url: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    // If user dismissed for session, navigate directly
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    setPendingUrl(url);
    setIsOpen(true);
  }, []);

  const handleContinue = useCallback(() => {
    if (dontShowAgain) {
      sessionStorage.setItem(SESSION_KEY, 'true');
    }
    
    if (pendingUrl) {
      window.open(pendingUrl, '_blank', 'noopener,noreferrer');
    }
    
    setIsOpen(false);
    setPendingUrl(null);
  }, [pendingUrl, dontShowAgain]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setPendingUrl(null);
  }, []);

  const toggleDontShowAgain = useCallback(() => {
    setDontShowAgain(prev => !prev);
  }, []);

  return {
    isOpen,
    pendingUrl,
    dontShowAgain,
    handleExternalClick,
    handleContinue,
    handleCancel,
    toggleDontShowAgain,
  };
}
