import { useState } from 'react';
import { useTeamMembers, useProjectInvitations, useInviteMember, useRemoveMember, useCancelInvitation } from '@/hooks/use-team';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Mail, Trash2, UserPlus, Users, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { z } from 'zod';

// Email validation schema
const emailSchema = z.string()
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

interface TeamManagementProps {
  projectId: string;
  ownerId: string;
}

export function TeamManagement({ projectId, ownerId }: TeamManagementProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');

  const { data: members, isLoading: membersLoading } = useTeamMembers(projectId);
  const { data: invitations, isLoading: invitationsLoading } = useProjectInvitations(projectId);
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();
  const cancelInvitation = useCancelInvitation();

  const [emailError, setEmailError] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    // Validate email format
    const validationResult = emailSchema.safeParse(trimmedEmail);
    if (!validationResult.success) {
      setEmailError(validationResult.error.errors[0].message);
      return;
    }

    try {
      await inviteMember.mutateAsync({ projectId, email: trimmedEmail, role });
      toast.success(`Invited ${trimmedEmail} as ${role}`);
      setEmail('');
      setEmailError(null);
    } catch (error: any) {
      const message = error.message || 'An error occurred';
      // Show specific errors inline, others as toast
      if (message.includes('already pending') || message.includes('already a member')) {
        setEmailError(message);
      } else {
        toast.error(message || 'Failed to send invitation');
      }
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      await removeMember.mutateAsync({ memberId, projectId });
      toast.success(`${memberName} removed from project`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    try {
      await cancelInvitation.mutateAsync({ invitationId, projectId });
      toast.info(`Invitation cancelled for ${email}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel invitation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </CardTitle>
          <CardDescription>
            Send an invitation to collaborate on this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1 space-y-1">
                <Label htmlFor="email" className="sr-only">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  maxLength={255}
                />
              </div>
              <div className="w-full sm:w-32">
                <Label htmlFor="role" className="sr-only">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={inviteMember.isPending || !email.trim()}>
                {inviteMember.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Send Invite
              </Button>
            </div>
            {emailError && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitationsLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ) : invitations && invitations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Clock className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{invite.email[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires {formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{invite.role}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCancelInvitation(invite.id, invite.email)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Current Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : members && members.length > 0 ? (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {(member.profile?.display_name || member.profile?.email || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.profile?.display_name || member.profile?.email}
                      </p>
                      {member.profile?.display_name && (
                        <p className="text-xs text-muted-foreground">{member.profile.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{member.role}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id, member.profile?.display_name || member.profile?.email || 'Member')}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No team members yet. Invite someone to collaborate!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
