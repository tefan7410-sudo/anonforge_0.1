import { useState, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useGenerationComments,
  useAddComment,
  useDeleteComment,
} from '@/hooks/use-generation-comments';
import { useMentionableUsers, type MentionableUser } from '@/hooks/use-mentions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getGenerationFileUrl, type Generation } from '@/hooks/use-generations';
import { Send, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GenerationDetailModalProps {
  generation: Generation | null;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerationDetailModal({
  generation,
  projectId,
  open,
  onOpenChange,
}: GenerationDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: comments, isLoading: commentsLoading } = useGenerationComments(
    generation?.id || null
  );
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const { data: mentionableUsers } = useMentionableUsers(projectId);

  const imageUrl = generation?.image_path
    ? getGenerationFileUrl(generation.image_path)
    : null;

  // Filter mentionable users based on query
  const filteredUsers = useMemo(() => {
    if (!mentionableUsers) return [];
    return mentionableUsers
      .filter((u) =>
        (u.display_name || u.email).toLowerCase().includes(mentionQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [mentionableUsers, mentionQuery]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setNewComment(value);

    // Detect @ mentions
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setMentionStartPos(cursorPos - mentionMatch[0].length);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionStartPos(null);
    }
  };

  const insertMention = (mentionUser: MentionableUser) => {
    if (mentionStartPos === null) return;

    const displayName = mentionUser.display_name || mentionUser.email.split('@')[0];
    // Format: @[DisplayName](user_id)
    const mentionText = `@[${displayName}](${mentionUser.id}) `;

    const beforeMention = newComment.slice(0, mentionStartPos);
    const cursorPos = textareaRef.current?.selectionStart || mentionStartPos;
    const afterMention = newComment.slice(cursorPos);

    setNewComment(beforeMention + mentionText + afterMention);
    setShowMentions(false);
    setMentionStartPos(null);
    setMentionQuery('');

    // Focus back on textarea
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // Extract mentioned user IDs from comment text
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@\[[^\]]+\]\(([^)]+)\)/g;
    const userIds: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      userIds.push(match[1]);
    }
    return userIds;
  };

  // Render comment content with mention highlighting
  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
      const mentionMatch = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
      if (mentionMatch) {
        return (
          <span key={i} className="text-primary font-medium">
            @{mentionMatch[1]}
          </span>
        );
      }
      return part;
    });
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !generation || !user) return;

    try {
      await addComment.mutateAsync({
        generationId: generation.id,
        userId: user.id,
        content: newComment.trim(),
      });

      // Extract mentioned user IDs and create notifications
      const mentionedUserIds = extractMentions(newComment);
      for (const mentionedUserId of mentionedUserIds) {
        // Don't notify self
        if (mentionedUserId === user.id) continue;

        await supabase.from('notifications').insert({
          user_id: mentionedUserId,
          type: 'comment_mention',
          title: 'You were mentioned',
          message: `Someone mentioned you in a comment on ${generation.token_id}`,
          link: `/project/${projectId}?generation=${generation.id}`,
          metadata: { generation_id: generation.id },
        });
      }

      setNewComment('');
      toast({ title: 'Comment added' });
    } catch {
      toast({ title: 'Failed to add comment', variant: 'destructive' });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!generation) return;

    try {
      await deleteComment.mutateAsync({
        commentId,
        generationId: generation.id,
      });
      toast({ title: 'Comment deleted' });
    } catch {
      toast({ title: 'Failed to delete comment', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Image Section */}
          <div className="flex-1 bg-muted/50 flex items-center justify-center p-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={generation?.token_id}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            ) : (
              <div className="text-muted-foreground">No image available</div>
            )}
          </div>

          {/* Comments Section */}
          <div className="w-full md:w-80 border-l border-border flex flex-col">
            <DialogHeader className="p-4 border-b border-border">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                {generation?.token_id}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1 p-4">
              {commentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="group">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.user?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {(comment.user?.display_name || comment.user?.email || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {comment.user?.display_name || comment.user?.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {renderCommentContent(comment.content)}
                          </p>
                        </div>
                        {user?.id === comment.user_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No comments yet. Be the first to add a note!
                </div>
              )}
            </ScrollArea>

            {/* Add Comment */}
            <div className="p-4 border-t border-border">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Add a comment... Use @ to mention team members"
                  value={newComment}
                  onChange={handleTextChange}
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleAddComment();
                    }
                    if (e.key === 'Escape' && showMentions) {
                      setShowMentions(false);
                    }
                  }}
                />

                {/* Mention Dropdown */}
                {showMentions && filteredUsers.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-1 w-full bg-popover border border-border rounded-md shadow-lg z-50 max-h-48 overflow-auto">
                    {filteredUsers.map((mentionUser) => (
                      <button
                        key={mentionUser.id}
                        onClick={() => insertMention(mentionUser)}
                        className="flex items-center gap-2 w-full p-2 hover:bg-muted text-left transition-colors"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={mentionUser.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {(mentionUser.display_name || mentionUser.email)
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">
                          {mentionUser.display_name || mentionUser.email}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">
                  ⌘/Ctrl + Enter to send
                </span>
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addComment.isPending}
                >
                  {addComment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
