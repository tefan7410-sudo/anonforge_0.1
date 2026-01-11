import { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useProfile, useUpdateProfile, useUploadAvatar, useResetPassword, useSyncProfileToCollections } from '@/hooks/use-profile';
import { useMyVerificationRequest, useSubmitVerificationRequest } from '@/hooks/use-verification-request';
import { useCreditBalance } from '@/hooks/use-credits';
import { formatCredits, CREDIT_COSTS } from '@/lib/credit-constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ArrowLeft, Save, User, Shield, AlertTriangle, Loader2, Camera, Mail, LogOut, BadgeCheck, Clock, X, Twitter, Coins, TrendingUp, GraduationCap, RotateCcw, RefreshCw, Wallet, Link2, Unlink } from 'lucide-react';
import { useWalletAuth, formatStakeAddress } from '@/hooks/use-wallet-auth';
import { WalletConnectModal } from '@/components/WalletConnectModal';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileNav } from '@/components/MobileNav';
import { FloatingHelpButton } from '@/components/FloatingHelpButton';
import { PageTransition } from '@/components/PageTransition';
import { useTutorial } from '@/contexts/TutorialContext';

function TutorialSection() {
  const { isActive, isCompleted, restartTutorial, loading } = useTutorial();
  const [isRestarting, setIsRestarting] = useState(false);

  const handleRestart = async () => {
    setIsRestarting(true);
    try {
      await restartTutorial();
      toast.success('Tutorial restarted! Head to your dashboard to begin.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsRestarting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <GraduationCap className="h-5 w-5" />
          Tutorial
        </CardTitle>
        <CardDescription>Learn how to use AnonForge</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">
              {isActive ? 'Tutorial in Progress' : isCompleted ? 'Tutorial Completed' : 'Interactive Tutorial'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isActive 
                ? 'Continue from where you left off' 
                : 'Take a guided tour of the platform features'
              }
            </p>
          </div>
          <Button 
            variant={isActive ? 'default' : 'outline'} 
            onClick={handleRestart}
            disabled={loading || isRestarting}
          >
            {isRestarting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            {isActive ? 'Restart Tutorial' : 'Start Tutorial'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isSetupMode = searchParams.get('setup') === 'true';
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading, error } = useProfile(user?.id);
  const { data: verificationRequest, isLoading: verificationLoading } = useMyVerificationRequest();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const resetPassword = useResetPassword();
  const submitVerification = useSubmitVerificationRequest();
  const syncToCollections = useSyncProfileToCollections();
  const { totalCredits, freeCredits, purchasedCredits, daysUntilReset, isLowCredits } = useCreditBalance();
  const { unlinkWallet, isConnecting: isWalletConnecting } = useWalletAuth();

  const [displayName, setDisplayName] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Verification form state
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationTwitter, setVerificationTwitter] = useState('');
  const [verificationBio, setVerificationBio] = useState('');
  
  // Setup mode state
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  // Initialize form when profile loads
  if (profile && !initialized) {
    setDisplayName(profile.display_name || '');
    setInitialized(true);
  }

  const handleSave = async () => {
    if (!user) return;

    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        displayName: displayName.trim(),
      });
      toast.success('Profile saved');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSetupComplete = async () => {
    if (!user) return;
    
    if (!displayName.trim()) {
      toast.error('Please enter a display name');
      return;
    }
    
    if (!acceptedTerms) {
      toast.error('Please accept the Terms of Service');
      return;
    }

    try {
      // Update profile with display name and terms acceptance
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          accepted_terms_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Invalidate profile queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['profile-incomplete', user.id] });
      
      toast.success('Welcome to AnonForge!');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const url = await uploadAvatar.mutateAsync({ userId: user.id, file });
      await updateProfile.mutateAsync({ userId: user.id, avatarUrl: url });
      toast.success('Profile picture updated', {
        action: {
          label: 'Sync to collections',
          onClick: () => handleSyncToCollections(url),
        },
      });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSyncToCollections = async (avatarUrl?: string) => {
    if (!user) return;
    try {
      const result = await syncToCollections.mutateAsync({
        userId: user.id,
        avatarUrl: avatarUrl || profile?.avatar_url || undefined,
        displayName: displayName || profile?.display_name || undefined,
      });
      if (result.updated > 0) {
        toast.success(`Updated ${result.updated} collection(s) with your profile`);
      } else {
        toast.info('No collections to update');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;

    try {
      await resetPassword.mutateAsync({ email: user.email });
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSubmitVerification = async () => {
    if (!verificationTwitter.trim()) {
      toast.error('Twitter handle is required');
      return;
    }

    try {
      await submitVerification.mutateAsync({
        twitterHandle: verificationTwitter.trim(),
        bio: verificationBio.trim() || undefined,
      });
      setShowVerificationForm(false);
      setVerificationTwitter('');
      setVerificationBio('');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDisconnectWallet = async () => {
    if (!user) return;
    try {
      await unlinkWallet(user.id);
      toast.success('Wallet disconnected');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect wallet');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50">
          <div className="container mx-auto flex items-center gap-4 px-6 py-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="container mx-auto max-w-2xl px-6 py-8">
          <Skeleton className="mb-8 h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Profile Error</CardTitle>
            <CardDescription>
              There was a problem loading your profile. This may be a temporary issue.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isVerifiedCreator = (profile as any)?.is_verified_creator;

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-primary p-2">
                <Logo className="h-full w-full" />
              </div>
              <div>
                <h1 className="font-display text-base sm:text-xl font-semibold">Profile</h1>
                <p className="hidden sm:block text-sm text-muted-foreground">Manage your account</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleSignOut} className="hidden md:inline-flex">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-6 py-6">
        <div className="space-y-6">
          {/* Setup Mode Banner */}
          {isSetupMode && (
            <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Wallet className="h-5 w-5 text-primary" />
                  Welcome to AnonForge!
                </CardTitle>
                <CardDescription>
                  Complete your profile to get started. Please set a display name and accept our terms of service.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">
                      {(displayName || profile?.email || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                    onClick={handleAvatarClick}
                    disabled={uploadAvatar.isPending}
                  >
                    {uploadAvatar.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <p className="font-medium">Profile Picture</p>
                  <p className="text-sm text-muted-foreground">Click the camera to upload a new photo</p>
                </div>
              </div>

              <Separator />

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="flex items-center gap-2">
                  Display Name
                  {isVerifiedCreator && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Shield className="h-3 w-3" />
                      Locked
                    </Badge>
                  )}
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  disabled={isVerifiedCreator}
                  className={isVerifiedCreator ? "bg-muted cursor-not-allowed" : ""}
                />
                {isVerifiedCreator && (
                  <p className="text-xs text-muted-foreground">
                    Verified creators cannot change their display name to maintain trust with collectors.
                  </p>
                )}
              </div>

              {/* Twitter Handle (for verified creators) */}
              {isVerifiedCreator && profile?.twitter_handle && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter Handle
                    <Badge variant="default" className="text-xs gap-1 bg-primary">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </Badge>
                  </Label>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                    <span className="text-sm">@{profile.twitter_handle}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Linked from your creator verification.
                  </p>
                </div>
              )}

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              {/* Setup Mode: Terms checkbox and complete button */}
              {isSetupMode ? (
                <div className="space-y-4 pt-2">
                  <Separator />
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
                        target="_blank"
                        className="text-primary hover:underline"
                      >
                        Terms of Service
                      </Link>
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSetupComplete} 
                      disabled={!displayName.trim() || !acceptedTerms || updateProfile.isPending}
                    >
                      {updateProfile.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Complete Setup
                    </Button>
                  </div>
                </div>
              ) : (
                /* Regular Save Button - only show if user can make changes */
                !isVerifiedCreator && (
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Creator Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <BadgeCheck className="h-5 w-5" />
                Creator Verification
              </CardTitle>
              <CardDescription>
                Get verified to show a badge on all your collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : isVerifiedCreator ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <BadgeCheck className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold text-primary">Verified Creator</p>
                    <p className="text-sm text-muted-foreground">
                      Your verified badge appears on all your collections
                    </p>
                  </div>
                </div>
              ) : verificationRequest?.status === 'pending' ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Clock className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="font-semibold text-amber-600">Verification Pending</p>
                    <p className="text-sm text-muted-foreground">
                      Your request is being reviewed by our team
                    </p>
                  </div>
                </div>
              ) : verificationRequest?.status === 'rejected' ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <X className="h-6 w-6 text-destructive mt-0.5" />
                    <div>
                      <p className="font-semibold text-destructive">Verification Rejected</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Reason: {verificationRequest.rejection_reason || 'No reason provided'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowVerificationForm(true)}
                  >
                    Resubmit Request
                  </Button>
                </div>
              ) : showVerificationForm ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verificationTwitter">
                      Twitter Handle <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="verificationTwitter"
                        value={verificationTwitter}
                        onChange={(e) => setVerificationTwitter(e.target.value)}
                        placeholder="@yourhandle"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="verificationBio">Bio / About You</Label>
                    <Textarea
                      id="verificationBio"
                      value={verificationBio}
                      onChange={(e) => setVerificationBio(e.target.value)}
                      placeholder="Tell us about your work in the NFT space..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitVerification}
                      disabled={submitVerification.isPending}
                    >
                      {submitVerification.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <BadgeCheck className="mr-2 h-4 w-4" />
                      )}
                      Submit Request
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowVerificationForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">Not Verified</p>
                    <p className="text-sm text-muted-foreground">
                      Request verification to get a badge on your collections
                    </p>
                  </div>
                  <Button onClick={() => setShowVerificationForm(true)}>
                    <BadgeCheck className="mr-2 h-4 w-4" />
                    Request Verification
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credits & Billing */}
          <Card className={isLowCredits ? 'border-orange-500/50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Coins className="h-5 w-5" />
                Credits & Billing
                {isLowCredits && (
                  <Badge variant="outline" className="border-orange-500 text-orange-500">
                    Low Balance
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Your credit balance and usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold">{formatCredits(totalCredits)}</p>
                  <p className="text-xs text-muted-foreground">Total Credits</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold">{formatCredits(freeCredits)}</p>
                  <p className="text-xs text-muted-foreground">Free (resets in {daysUntilReset}d)</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold">{formatCredits(purchasedCredits)}</p>
                  <p className="text-xs text-muted-foreground">Purchased</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Full resolution: {CREDIT_COSTS.FULL_RESOLUTION} credits • Preview: {CREDIT_COSTS.PREVIEW} credits
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/credits">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Details & Buy
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    Send a password reset link to your email
                  </p>
                </div>
                <Button variant="outline" onClick={handleResetPassword} disabled={resetPassword.isPending}>
                  {resetPassword.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Reset Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Connected Wallet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Wallet className="h-5 w-5" />
                Connected Wallet
              </CardTitle>
              <CardDescription>
                Link a Cardano wallet for wallet-based sign-in
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.stake_address ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">Cardano Wallet</p>
                        <p className="text-sm text-muted-foreground font-mono truncate">
                          {formatStakeAddress(profile.stake_address)}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        <Link2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    {profile.wallet_connected_at && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Connected on {new Date(profile.wallet_connected_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Unlink className="h-4 w-4 mr-2" />
                          Disconnect Wallet
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect wallet?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You will no longer be able to sign in with this wallet. 
                            You can reconnect it later from your profile.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDisconnectWallet}>
                            Disconnect
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">No Wallet Connected</p>
                    <p className="text-sm text-muted-foreground">
                      Connect a Cardano wallet to enable wallet-based sign-in
                    </p>
                  </div>
                  <Button onClick={() => setShowWalletModal(true)} disabled={isWalletConnecting}>
                    {isWalletConnecting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wallet className="mr-2 h-4 w-4" />
                    )}
                    Connect Wallet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <WalletConnectModal
            open={showWalletModal}
            onClose={() => setShowWalletModal(false)}
            mode="link"
            onSuccess={() => setShowWalletModal(false)}
          />

          {/* Tutorial */}
          <TutorialSection />

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that will permanently affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account,
                        all your projects, layers, and generations. If you want to proceed,
                        please contact support.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          toast.info('Please contact support to delete your account');
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Contact Support
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <FloatingHelpButton />
    </div>
    </PageTransition>
  );
}
