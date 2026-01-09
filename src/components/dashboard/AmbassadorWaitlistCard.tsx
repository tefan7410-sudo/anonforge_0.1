import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMyAmbassadorRequest, useSubmitAmbassadorRequest } from '@/hooks/use-ambassador';
import { Megaphone, Clock, X, Send, Loader2, Twitter } from 'lucide-react';
import { isValidTwitterUrl } from '@/lib/url-validation';

export function AmbassadorWaitlistCard() {
  const { data: existingRequest, isLoading } = useMyAmbassadorRequest();
  const submitRequest = useSubmitAmbassadorRequest();
  
  const [twitterLink, setTwitterLink] = useState('');
  const [twitterError, setTwitterError] = useState('');

  const validateTwitterLink = (value: string) => {
    if (!value.trim()) {
      setTwitterError('Twitter/X link is required');
      return false;
    }
    const result = isValidTwitterUrl(value);
    if (!result.isValid) {
      setTwitterError(result.error || 'Invalid Twitter/X URL');
      return false;
    }
    setTwitterError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTwitterLink(twitterLink)) return;
    
    await submitRequest.mutateAsync({ twitterLink: twitterLink.trim() });
    setTwitterLink('');
  };

  if (isLoading) {
    return (
      <Card className="border-muted">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Show status if request exists
  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      return (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="font-display text-lg">Request Pending</CardTitle>
                <CardDescription>
                  Your ambassador access request is being reviewed by our team.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              {existingRequest.twitter_link && (
                <a 
                  href={existingRequest.twitter_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Twitter className="h-4 w-4" />
                  {existingRequest.twitter_link}
                </a>
              )}
              <p className="text-xs text-muted-foreground">
                We'll reach out on Twitter/X to verify your identity.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Submitted {new Date(existingRequest.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (existingRequest.status === 'rejected') {
      return (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <X className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="font-display text-lg">Request Declined</CardTitle>
                <CardDescription>
                  Unfortunately, your ambassador request was not approved.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingRequest.rejection_reason && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Reason:</strong> {existingRequest.rejection_reason}
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twitter-reapply">Reapply with your Twitter/X link</Label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="twitter-reapply"
                    placeholder="https://twitter.com/yourhandle"
                    value={twitterLink}
                    onChange={(e) => {
                      setTwitterLink(e.target.value);
                      if (twitterError) validateTwitterLink(e.target.value);
                    }}
                    className="pl-10"
                    required
                  />
                </div>
                {twitterError && (
                  <p className="text-xs text-destructive">{twitterError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  You will be messaged on Twitter/X to confirm your identity
                </p>
              </div>
              <Button type="submit" disabled={submitRequest.isPending || !twitterLink.trim()}>
                {submitRequest.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Reapply
              </Button>
            </form>
          </CardContent>
        </Card>
      );
    }
  }

  // Show request form
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display text-lg">Become an Ambassador</CardTitle>
            <CardDescription>
              Help independent artists get in front of your audience
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">Promote Indie Artists</Badge>
            <Badge variant="secondary">Monetize Your Reach</Badge>
            <Badge variant="secondary">Early Access</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            As an ambassador, you help independent artists get in front of your audience. 
            This feature is currently in limited access - submit your Twitter/X profile to join the waitlist.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twitter-link">Twitter / X Profile Link *</Label>
            <div className="relative">
              <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="twitter-link"
                placeholder="https://twitter.com/yourhandle"
                value={twitterLink}
                onChange={(e) => {
                  setTwitterLink(e.target.value);
                  if (twitterError) validateTwitterLink(e.target.value);
                }}
                className="pl-10"
                required
              />
            </div>
            {twitterError && (
              <p className="text-xs text-destructive">{twitterError}</p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              ℹ️ You will be messaged on Twitter/X to confirm your identity
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={submitRequest.isPending || !twitterLink.trim()}
          >
            {submitRequest.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit Request
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
