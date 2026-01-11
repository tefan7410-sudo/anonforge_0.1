import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Wallet } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { PageTransition } from '@/components/PageTransition';
import { WalletConnectModal } from '@/components/WalletConnectModal';
import { EmailVerificationPending } from '@/components/EmailVerificationPending';

const GoogleIcon = () => (
  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const { user, loading: authLoading, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if redirected from wallet login for auto-registration
  const walletAutoRegister = (location.state as any)?.walletAutoRegister;
  const walletKey = (location.state as any)?.walletKey;

  // Auto-open wallet modal if redirected from login with unregistered wallet
  useEffect(() => {
    if (walletAutoRegister && !showWalletModal) {
      setShowWalletModal(true);
      // Clear the state to prevent re-opening on navigation
      window.history.replaceState({}, document.title);
    }
  }, [walletAutoRegister]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show verification pending screen
  if (verificationPending) {
    return (
      <EmailVerificationPending 
        email={pendingEmail} 
        onBack={() => {
          setVerificationPending(false);
          setPendingEmail('');
        }}
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast.error('Please accept the Terms of Service to continue.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, displayName || undefined);

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      // Store marketing consent for later (will be updated when user verifies)
      // For now, show verification pending screen
      setPendingEmail(email);
      setVerificationPending(true);
      setLoading(false);
    }
  };

  return (
    <PageTransition className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Link to="/" className="absolute left-4 top-4">
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>

      <Link to="/" className="mb-8 flex items-center gap-3 transition-opacity hover:opacity-80">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary p-2">
          <Logo className="h-full w-full" />
        </div>
        <h1 className="font-display text-3xl font-bold">AnonForge</h1>
      </Link>

      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="font-display text-2xl">Create account</CardTitle>
          <CardDescription>Start generating unique profile pictures</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>

            {/* Terms of Service checkbox */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer">
                I agree to the{' '}
                <Link
                  to="/terms-of-service"
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service
                </Link>
                <span className="text-destructive ml-1">*</span>
              </Label>
            </div>

            {/* Marketing consent checkbox */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="marketing"
                checked={marketingConsent}
                onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                className="mt-1"
              />
              <Label htmlFor="marketing" className="text-sm font-normal leading-relaxed text-muted-foreground cursor-pointer">
                I want to receive product updates, tips, and marketing emails (optional)
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || googleLoading || !acceptedTerms}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading || googleLoading}
              onClick={async () => {
                setGoogleLoading(true);
                const { error } = await signInWithGoogle();
                if (error) {
                  toast.error(error.message);
                  setGoogleLoading(false);
                }
              }}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Sign in with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading || googleLoading}
              onClick={() => setShowWalletModal(true)}
            >
              <Wallet className="mr-2 h-5 w-5" />
              Register with Cardano Wallet
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <WalletConnectModal
        open={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        mode="register"
        onSuccess={() => navigate('/profile?setup=true', { replace: true })}
      />
    </PageTransition>
  );
}
