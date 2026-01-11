import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmailVerificationPending } from '@/components/EmailVerificationPending';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Check if user is a wallet-only user (synthetic email)
function isWalletUser(email?: string | null): boolean {
  return email?.endsWith('@wallet.anonforge.com') ?? false;
}

// Check if user signed in via OAuth (Google, etc.)
function isOAuthUser(user: any): boolean {
  const provider = user?.app_metadata?.provider;
  return provider && provider !== 'email';
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowLoader(true), 50);
      return () => clearTimeout(timer);
    }
    setShowLoader(false);
  }, [loading]);

  if (loading) {
    return (
      <div 
        className={cn(
          "flex min-h-screen items-center justify-center bg-background transition-opacity duration-200",
          showLoader ? "opacity-100" : "opacity-0"
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check email verification for non-wallet, non-OAuth users
  const needsEmailVerification = 
    !isWalletUser(user.email) && 
    !isOAuthUser(user) && 
    !user.email_confirmed_at;

  if (needsEmailVerification && user.email) {
    return <EmailVerificationPending email={user.email} />;
  }

  return <>{children}</>;
}
