import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { PageTransition } from '@/components/PageTransition';

interface EmailVerificationPendingProps {
  email: string;
  onBack?: () => void;
}

export function EmailVerificationPending({ email, onBack }: EmailVerificationPendingProps) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        setResent(true);
        toast.success('Verification email sent!');
      }
    } catch (err) {
      toast.error('Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <PageTransition className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Link to="/" className="mb-8 flex items-center gap-3 transition-opacity hover:opacity-80">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary p-2">
          <Logo className="h-full w-full" />
        </div>
        <h1 className="font-display text-3xl font-bold">AnonForge</h1>
      </Link>

      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">Check your email</CardTitle>
          <CardDescription>
            We've sent a verification link to
          </CardDescription>
          <p className="font-medium text-foreground">{email}</p>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Click the link in your email to verify your account and start using AnonForge.
          </p>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Can't find the email? Check your spam folder or click below to resend.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            onClick={handleResend}
            variant="outline"
            className="w-full"
            disabled={resending || resent}
          >
            {resending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resent ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Email sent!
              </>
            ) : (
              'Resend verification email'
            )}
          </Button>
          
          {onBack ? (
            <Button variant="ghost" onClick={onBack} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to registration
            </Button>
          ) : (
            <Link to="/login" className="w-full">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </PageTransition>
  );
}
