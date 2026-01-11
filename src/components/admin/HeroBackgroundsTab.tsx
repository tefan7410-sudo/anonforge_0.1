import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  useAdminHeroBackgrounds, 
  useUploadHeroBackground, 
  useDeleteHeroBackground,
  useToggleHeroBackgroundActive,
} from '@/hooks/use-hero-backgrounds';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/components/ui/alert-dialog';
import { 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  Loader2,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function HeroBackgroundsTab() {
  const { data: backgrounds, isLoading } = useAdminHeroBackgrounds();
  const uploadMutation = useUploadHeroBackground();
  const deleteMutation = useDeleteHeroBackground();
  const toggleActiveMutation = useToggleHeroBackgroundActive();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBackground, setDeletingBackground] = useState<{ id: string; storagePath: string } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      uploadMutation.mutate(file);
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const handleDeleteClick = (id: string, storagePath: string) => {
    setDeletingBackground({ id, storagePath });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingBackground) {
      deleteMutation.mutate(deletingBackground);
      setDeleteDialogOpen(false);
      setDeletingBackground(null);
    }
  };

  const activeCount = backgrounds?.filter(bg => bg.is_active).length || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Hero Backgrounds
          </CardTitle>
          <CardDescription>
            Manage custom background images for the landing page hero section. 
            These images will rotate in a slideshow alongside the default gradient 
            and any active marketing promotions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How the slideshow works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Default gradient background is always shown first</li>
                <li>Active marketing images (if any) rotate next</li>
                <li>Your custom backgrounds rotate after</li>
                <li>Each image displays for 6 seconds</li>
              </ul>
            </div>
          </div>

          {/* Upload zone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              }
              ${uploadMutation.isPending ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            {uploadMutation.isPending ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {isDragActive ? 'Drop images here' : 'Drag & drop images or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP up to 10MB. Recommended: 1920x1080 or similar aspect ratio.
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{backgrounds?.length || 0} total backgrounds</span>
            <span>•</span>
            <span>{activeCount} active in rotation</span>
          </div>

          {/* Backgrounds grid */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="aspect-video rounded-lg" />
              ))}
            </div>
          ) : backgrounds?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No custom backgrounds uploaded yet</p>
              <p className="text-sm">Upload your first background image above</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {backgrounds?.map((bg, index) => (
                <div 
                  key={bg.id}
                  className="group relative aspect-video rounded-lg overflow-hidden border border-border bg-muted"
                >
                  <img 
                    src={bg.image_url} 
                    alt={`Background ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  
                  {/* Overlay with controls */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex items-start justify-between">
                      <Badge 
                        variant={bg.is_active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {bg.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteClick(bg.id, bg.storage_path)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/70">
                        {formatDistanceToNow(new Date(bg.created_at), { addSuffix: true })}
                      </span>
                      <div className="flex items-center gap-2">
                        {bg.is_active ? (
                          <Eye className="h-4 w-4 text-white/70" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-white/70" />
                        )}
                        <Switch
                          checked={bg.is_active}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ id: bg.id, isActive: checked })
                          }
                          disabled={toggleActiveMutation.isPending}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Order indicator */}
                  <div className="absolute top-2 left-2 bg-background/80 rounded px-2 py-0.5 text-xs font-medium">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Background</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this background? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
