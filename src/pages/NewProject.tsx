import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Check, Loader2, Layers, Lock, Globe } from 'lucide-react';
import { z } from 'zod';
import { FloatingHelpButton } from '@/components/FloatingHelpButton';

// Input validation schemas
const projectNameSchema = z.string()
  .min(1, 'Project name is required')
  .max(100, 'Project name must be less than 100 characters')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Project name can only contain letters, numbers, spaces, hyphens, and underscores');

const projectDescriptionSchema = z.string()
  .max(500, 'Description must be less than 500 characters')
  .optional();

const tokenPrefixSchema = z.string()
  .max(20, 'Token prefix must be less than 20 characters')
  .regex(/^[a-zA-Z0-9\-_]*$/, 'Token prefix can only contain letters, numbers, hyphens, and underscores')
  .optional();

type Step = 'details' | 'privacy' | 'confirm';

export default function NewProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tokenPrefix, setTokenPrefix] = useState('Token');

  const steps: Step[] = ['details', 'privacy', 'confirm'];
  const currentStepIndex = steps.indexOf(step);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateInputs = () => {
    const errors: Record<string, string> = {};
    
    const nameResult = projectNameSchema.safeParse(name.trim());
    if (!nameResult.success) {
      errors.name = nameResult.error.errors[0].message;
    }
    
    if (description.trim()) {
      const descResult = projectDescriptionSchema.safeParse(description.trim());
      if (!descResult.success) {
        errors.description = descResult.error.errors[0].message;
      }
    }
    
    if (tokenPrefix.trim()) {
      const prefixResult = tokenPrefixSchema.safeParse(tokenPrefix.trim());
      if (!prefixResult.success) {
        errors.tokenPrefix = prefixResult.error.errors[0].message;
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const canProceed = () => {
    switch (step) {
      case 'details':
        return name.trim().length > 0 && name.trim().length <= 100;
      case 'privacy':
        return true;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    } else {
      navigate('/dashboard');
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    
    // Validate all inputs before submission
    if (!validateInputs()) {
      toast({
        title: 'Validation error',
        description: 'Please fix the errors before continuing.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);

    // Sanitize inputs
    const sanitizedName = name.trim().slice(0, 100);
    const sanitizedDescription = description.trim().slice(0, 500) || null;
    const sanitizedPrefix = tokenPrefix.trim().slice(0, 20) || 'Token';

    const { data, error } = await supabase
      .from('projects')
      .insert({
        owner_id: user.id,
        name: sanitizedName,
        description: sanitizedDescription,
        is_public: isPublic,
        token_prefix: sanitizedPrefix,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Failed to create project',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    } else {
      toast({
        title: 'Project created',
        description: `${sanitizedName} is ready to use.`,
      });
      navigate(`/project/${data.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">New Project</span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    i < currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : i === currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-12 ${
                      i < currentStepIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto max-w-xl px-6 py-12">
        {step === 'details' && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Project Details</CardTitle>
              <CardDescription>Give your project a name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Project name *</Label>
                <Input
                  id="name"
                  placeholder="My NFT Collection"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  autoFocus
                />
                {validationErrors.name && (
                  <p className="text-xs text-destructive">{validationErrors.name}</p>
                )}
                <p className="text-xs text-muted-foreground">{name.length}/100 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A collection of unique characters..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
                {validationErrors.description && (
                  <p className="text-xs text-destructive">{validationErrors.description}</p>
                )}
                <p className="text-xs text-muted-foreground">{description.length}/500 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenPrefix">Token prefix</Label>
                <Input
                  id="tokenPrefix"
                  placeholder="Token"
                  value={tokenPrefix}
                  onChange={(e) => setTokenPrefix(e.target.value)}
                  maxLength={20}
                />
                {validationErrors.tokenPrefix && (
                  <p className="text-xs text-destructive">{validationErrors.tokenPrefix}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Used in metadata (e.g., {tokenPrefix || 'Token'}0001, {tokenPrefix || 'Token'}0002...)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'privacy' && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Privacy Settings</CardTitle>
              <CardDescription>Control who can view your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border/50 p-4">
                <div className="flex gap-3">
                  {isPublic ? (
                    <Globe className="mt-0.5 h-5 w-5 text-primary" />
                  ) : (
                    <Lock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{isPublic ? 'Public' : 'Private'}</p>
                    <p className="text-sm text-muted-foreground">
                      {isPublic
                        ? 'Anyone can view this project and its generations'
                        : 'Only you and invited members can access this project'}
                    </p>
                  </div>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'confirm' && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Review & Create</CardTitle>
              <CardDescription>Confirm your project settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">Name</dt>
                    <dd className="font-medium">{name}</dd>
                  </div>
                  {description && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Description</dt>
                      <dd>{description}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-muted-foreground">Token prefix</dt>
                    <dd>{tokenPrefix || 'Token'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Visibility</dt>
                    <dd className="flex items-center gap-2">
                      {isPublic ? (
                        <>
                          <Globe className="h-4 w-4 text-primary" />
                          Public
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Private
                        </>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {step === 'confirm' ? (
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>

      <FloatingHelpButton />
    </div>
  );
}
