import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useMyPromoterRequest, useSubmitPromoterRequest } from '@/hooks/use-promoter';
import { Megaphone, Clock, X, Send, Loader2, Plus, Trash2 } from 'lucide-react';

export function PromoterWaitlistCard() {
  const { data: existingRequest, isLoading } = useMyPromoterRequest();
  const submitRequest = useSubmitPromoterRequest();
  
  const [reason, setReason] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(['']);

  const handleAddLink = () => {
    setPortfolioLinks([...portfolioLinks, '']);
  };

  const handleRemoveLink = (index: number) => {
    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...portfolioLinks];
    newLinks[index] = value;
    setPortfolioLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLinks = portfolioLinks.filter(link => link.trim() !== '');
    await submitRequest.mutateAsync({ reason, portfolioLinks: validLinks });
    setReason('');
    setPortfolioLinks(['']);
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
                  Your promoter access request is being reviewed by our team.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Your reason:</strong> {existingRequest.reason || 'No reason provided'}
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
                  Unfortunately, your promoter request was not approved.
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
                <Label htmlFor="reason">Reapply with a new reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you'd like to become a promoter..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  minLength={20}
                />
              </div>
              <Button type="submit" disabled={submitRequest.isPending || reason.length < 20}>
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
            <CardTitle className="font-display text-lg">Become a Promoter</CardTitle>
            <CardDescription>
              Help promote collections and earn rewards. Join our promoter program!
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">Promote Collections</Badge>
            <Badge variant="secondary">Earn Rewards</Badge>
            <Badge variant="secondary">Early Access</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            As a promoter, you'll help spread the word about collections on our platform. 
            This feature is currently in limited access - submit your request to join the waitlist.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Why do you want to become a promoter?</Label>
            <Textarea
              id="reason"
              placeholder="Tell us about your experience with marketing, your audience, or why you'd be a great promoter..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={20}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">Minimum 20 characters</p>
          </div>

          <div className="space-y-2">
            <Label>Portfolio / Social Links (optional)</Label>
            {portfolioLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="https://twitter.com/yourhandle"
                  value={link}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                />
                {portfolioLinks.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLink(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {portfolioLinks.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLink}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={submitRequest.isPending || reason.length < 20}
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
