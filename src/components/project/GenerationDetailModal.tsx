import { useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getGenerationFileUrl, type Generation } from '@/hooks/use-generations';
import { Send, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GenerationDetailModalProps {
  generation: Generation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerationDetailModal({
  generation,
  open,
  onOpenChange,
}: GenerationDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');

  const { data: comments, isLoading: commentsLoading } = useGenerationComments(
    generation?.id || null
  );
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  const imageUrl = generation?.image_path
    ? getGenerationFileUrl(generation.image_path)
    : null;

  const handleAddComment = async () => {
    if (!newComment.trim() || !generation || !user) return;

    try {
      await addComment.mutateAsync({
        generationId: generation.id,
        userId: user.id,
        content: newComment.trim(),
      });
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
                            {comment.content}
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
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment or note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleAddComment();
                    }
                  }}
                />
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
