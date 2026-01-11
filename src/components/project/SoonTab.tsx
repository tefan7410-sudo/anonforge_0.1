import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Gavel, Coins, BarChart3, Sparkles, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { BugReportModal } from '@/components/BugReportModal';

const PLANNED_FEATURES = [
  {
    icon: Gavel,
    name: 'Auctions',
    description: 'Run timed auctions for rare pieces',
  },
  {
    icon: Coins,
    name: 'Staking',
    description: 'Enable staking rewards for holders',
  },
  {
    icon: BarChart3,
    name: 'Rarity Pages',
    description: 'Auto-generated rarity rankings',
  },
  {
    icon: Sparkles,
    name: 'Custom Features',
    description: 'Your ideas could become features',
  },
];

export function SoonTab() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Card className="max-w-lg w-full text-center">
        <CardHeader className="pb-3">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="font-display text-lg">Coming Soon</CardTitle>
          <CardDescription className="text-sm">
            We're building with our community. These features are on our roadmap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Planned Features */}
          <div className="text-left rounded-lg border bg-muted/30 p-3">
            <h4 className="text-xs font-medium mb-2">Planned Features:</h4>
            <ul className="space-y-2">
              {PLANNED_FEATURES.map((feature) => (
                <li key={feature.name} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <feature.icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" />
                  <div>
                    <span className="font-medium text-foreground">{feature.name}</span>
                    <span className="mx-1">—</span>
                    {feature.description}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Message */}
          <div className="text-left rounded-lg border border-primary/20 bg-primary/5 p-3">
            <h4 className="text-xs font-medium mb-1 text-primary">Have an idea?</h4>
            <p className="text-xs text-muted-foreground">
              We scale with our creators. While we currently have a focused feature set, 
              we have the capacity to add any features you need. All additions come at 
              no extra cost as part of our platform. Share your proposals with us!
            </p>
          </div>

          {/* CTA Button */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setFeedbackOpen(true)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Share Your Ideas
          </Button>
        </CardContent>
      </Card>

      {/* Reuse BugReportModal for feedback */}
      <BugReportModal 
        open={feedbackOpen} 
        onOpenChange={setFeedbackOpen}
      />
    </div>
  );
}
