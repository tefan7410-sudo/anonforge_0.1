import { useState, useMemo } from 'react';
import { useGenerations, getGenerationFileUrl } from '@/hooks/use-generations';
import { useNmkrUploads, useUploadNft, NmkrProject } from '@/hooks/use-nmkr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface NftUploadQueueProps {
  projectId: string;
  nmkrProject: NmkrProject;
}

export function NftUploadQueue({ projectId, nmkrProject }: NftUploadQueueProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const { data: generations = [] } = useGenerations(projectId);
  const { data: uploads = [] } = useNmkrUploads(nmkrProject.id);
  const uploadNft = useUploadNft();

  // Get already uploaded generation IDs
  const uploadedGenerationIds = useMemo(() => {
    return new Set(uploads.map(u => u.generation_id));
  }, [uploads]);

  // Filter to only single generations (not batches/zips)
  const uploadableGenerations = useMemo(() => {
    return generations.filter(g => 
      g.generation_type === 'single' && 
      g.image_path && 
      !uploadedGenerationIds.has(g.id)
    );
  }, [generations, uploadedGenerationIds]);

  const handleSelectAll = () => {
    if (selectedIds.size === uploadableGenerations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(uploadableGenerations.map(g => g.id)));
    }
  };

  const handleToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleUpload = async () => {
    const toUpload = uploadableGenerations.filter(g => selectedIds.has(g.id));
    if (toUpload.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: toUpload.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < toUpload.length; i++) {
      const gen = toUpload[i];
      setUploadProgress({ current: i + 1, total: toUpload.length });

      try {
        // Fetch the image and convert to base64
        const imageUrl = getGenerationFileUrl(gen.image_path!);
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            // Remove data URL prefix
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });

        await uploadNft.mutateAsync({
          nmkrProjectId: nmkrProject.id,
          nmkrProjectUid: nmkrProject.nmkr_project_uid,
          generationId: gen.id,
          tokenName: gen.token_id.replace(/[^a-zA-Z0-9]/g, ''),
          displayName: gen.token_id,
          description: `Generated NFT - ${gen.token_id}`,
          imageBase64: base64,
        });

        successCount++;
      } catch (error) {
        console.error(`Failed to upload ${gen.token_id}:`, error);
        failCount++;
      }
    }

    setUploading(false);
    setSelectedIds(new Set());

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} NFT${successCount > 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to upload ${failCount} NFT${failCount > 1 ? 's' : ''}`);
    }
  };

  const getUploadStatus = (generationId: string) => {
    const upload = uploads.find(u => u.generation_id === generationId);
    return upload?.upload_status;
  };

  const statusIcon = {
    pending: <Clock className="h-4 w-4 text-muted-foreground" />,
    uploading: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
    uploaded: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-destructive" />,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Upload NFTs</CardTitle>
        <CardDescription>
          Select generated images to upload to your NMKR project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload progress */}
        {uploading && (
          <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading NFTs...</span>
              <span>{uploadProgress.current} / {uploadProgress.total}</span>
            </div>
            <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
          </div>
        )}

        {/* Selection controls */}
        {uploadableGenerations.length > 0 && (
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectAll}
              disabled={uploading}
            >
              {selectedIds.size === uploadableGenerations.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={selectedIds.size === 0 || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Already uploaded section */}
        {uploads.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Uploaded ({uploads.filter(u => u.upload_status === 'uploaded').length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {uploads.slice(0, 10).map((upload) => (
                <Badge 
                  key={upload.id} 
                  variant={upload.upload_status === 'uploaded' ? 'secondary' : 'destructive'}
                  className="gap-1"
                >
                  {statusIcon[upload.upload_status as keyof typeof statusIcon]}
                  {upload.token_name}
                </Badge>
              ))}
              {uploads.length > 10 && (
                <Badge variant="outline">+{uploads.length - 10} more</Badge>
              )}
            </div>
          </div>
        )}

        {/* Uploadable generations list */}
        {uploadableGenerations.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {uploadableGenerations.map((gen) => {
                const status = getUploadStatus(gen.id);
                const imageUrl = gen.image_path ? getGenerationFileUrl(gen.image_path) : null;

                return (
                  <div
                    key={gen.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selectedIds.has(gen.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Checkbox
                      checked={selectedIds.has(gen.id)}
                      onCheckedChange={() => handleToggle(gen.id)}
                      disabled={uploading || !!status}
                    />
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={gen.token_id}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{gen.token_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {gen.is_favorite ? '⭐ Favorite' : 'Single'}
                      </p>
                    </div>
                    {status && statusIcon[status as keyof typeof statusIcon]}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : generations.length > 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
            <CheckCircle2 className="mb-3 h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">All NFTs Uploaded!</p>
            <p className="text-sm text-muted-foreground">
              All your generated images have been uploaded to NMKR
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
            <AlertCircle className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No Generations Yet</p>
            <p className="text-sm text-muted-foreground">
              Generate some NFTs first, then come back here to upload them
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
