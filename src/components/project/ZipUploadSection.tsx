import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Loader2, 
  FileArchive, 
  ImageIcon, 
  FileJson,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUploadNft, NmkrProject } from '@/hooks/use-nmkr';

interface ZipUploadSectionProps {
  nmkrProject: NmkrProject;
}

interface ParsedNft {
  name: string;
  imageBase64: string;
  metadata: Record<string, string>;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
}

export function ZipUploadSection({ nmkrProject }: ZipUploadSectionProps) {
  const [parsedNfts, setParsedNfts] = useState<ParsedNft[]>([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const uploadNft = useUploadNft();

  const parseZipFile = async (file: File) => {
    setParsing(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const imageFiles: { [name: string]: string } = {};
      const metadataFiles: { [name: string]: Record<string, unknown> } = {};

      // First pass: collect all files
      const filePromises: Promise<void>[] = [];
      
      zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;
        
        const fileName = relativePath.split('/').pop() || relativePath;
        const baseName = fileName.replace(/\.(png|jpg|jpeg|webp|json)$/i, '');
        const ext = fileName.split('.').pop()?.toLowerCase();

        if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
          filePromises.push(
            zipEntry.async('base64').then((base64) => {
              imageFiles[baseName] = base64;
            })
          );
        } else if (ext === 'json') {
          filePromises.push(
            zipEntry.async('string').then((content) => {
              try {
                metadataFiles[baseName] = JSON.parse(content);
              } catch {
                console.warn(`Failed to parse JSON: ${fileName}`);
              }
            })
          );
        }
      });

      await Promise.all(filePromises);

      // Match images with metadata
      const nfts: ParsedNft[] = [];
      for (const [name, imageBase64] of Object.entries(imageFiles)) {
        const metadata = metadataFiles[name] || {};
        const flatMetadata: Record<string, string> = {};
        
        // Flatten metadata for NMKR
        for (const [key, value] of Object.entries(metadata)) {
          if (typeof value === 'string') {
            flatMetadata[key] = value;
          } else if (typeof value === 'number' || typeof value === 'boolean') {
            flatMetadata[key] = String(value);
          }
        }

        nfts.push({
          name: name.replace(/[^a-zA-Z0-9]/g, ''),
          imageBase64,
          metadata: flatMetadata,
          status: 'pending',
        });
      }

      if (nfts.length === 0) {
        toast.error('No valid images found in ZIP file');
      } else {
        toast.success(`Found ${nfts.length} NFTs in ZIP file`);
        setParsedNfts(nfts);
      }
    } catch (error) {
      console.error('Error parsing ZIP:', error);
      toast.error('Failed to parse ZIP file');
    } finally {
      setParsing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      parseZipFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    maxFiles: 1,
    disabled: parsing || uploading,
  });

  const handleUploadAll = async () => {
    const pendingNfts = parsedNfts.filter(nft => nft.status === 'pending');
    if (pendingNfts.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: pendingNfts.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pendingNfts.length; i++) {
      const nft = pendingNfts[i];
      setUploadProgress({ current: i + 1, total: pendingNfts.length });

      // Update status to uploading
      setParsedNfts(prev => prev.map(n => 
        n.name === nft.name ? { ...n, status: 'uploading' as const } : n
      ));

      try {
        await uploadNft.mutateAsync({
          nmkrProjectId: nmkrProject.id,
          nmkrProjectUid: nmkrProject.nmkr_project_uid,
          generationId: `zip-${nft.name}-${Date.now()}`,
          tokenName: nft.name,
          displayName: nft.metadata.name || nft.name,
          description: nft.metadata.description || `NFT - ${nft.name}`,
          imageBase64: nft.imageBase64,
          metadata: nft.metadata,
        });

        setParsedNfts(prev => prev.map(n => 
          n.name === nft.name ? { ...n, status: 'uploaded' as const } : n
        ));
        successCount++;
      } catch (error) {
        console.error(`Failed to upload ${nft.name}:`, error);
        setParsedNfts(prev => prev.map(n => 
          n.name === nft.name ? { ...n, status: 'failed' as const } : n
        ));
        failCount++;
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} NFTs from ZIP`);
    }
    if (failCount > 0) {
      toast.error(`Failed to upload ${failCount} NFTs`);
    }
  };

  const clearParsedNfts = () => {
    setParsedNfts([]);
  };

  const pendingCount = parsedNfts.filter(n => n.status === 'pending').length;
  const uploadedCount = parsedNfts.filter(n => n.status === 'uploaded').length;
  const failedCount = parsedNfts.filter(n => n.status === 'failed').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <FileArchive className="h-5 w-5 text-primary" />
          Bulk Upload from ZIP
        </CardTitle>
        <CardDescription>
          Upload a ZIP file containing images and optional JSON metadata files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        {parsedNfts.length === 0 && (
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
              (parsing || uploading) && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            {parsing ? (
              <>
                <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Parsing ZIP file...</p>
              </>
            ) : (
              <>
                <FileArchive className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {isDragActive ? "Drop ZIP file here" : "Drag & drop ZIP file or click to select"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supports: image.png + image.json pairs
                </p>
              </>
            )}
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading NFTs from ZIP...</span>
              <span>{uploadProgress.current} / {uploadProgress.total}</span>
            </div>
            <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
          </div>
        )}

        {/* Parsed NFTs list */}
        {parsedNfts.length > 0 && (
          <>
            {/* Summary & actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{parsedNfts.length} NFTs</Badge>
                {uploadedCount > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {uploadedCount} uploaded
                  </Badge>
                )}
                {failedCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {failedCount} failed
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearParsedNfts}
                  disabled={uploading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
                <Button 
                  size="sm"
                  onClick={handleUploadAll}
                  disabled={uploading || pendingCount === 0}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload {pendingCount > 0 ? `(${pendingCount})` : 'All'}
                </Button>
              </div>
            </div>

            {/* NFT grid */}
            <ScrollArea className="h-[300px]">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {parsedNfts.map((nft) => (
                  <div
                    key={nft.name}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3",
                      nft.status === 'uploaded' && "border-green-500/30 bg-green-500/5",
                      nft.status === 'failed' && "border-destructive/30 bg-destructive/5"
                    )}
                  >
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
                      <img
                        src={`data:image/png;base64,${nft.imageBase64.substring(0, 100)}...`}
                        alt={nft.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{nft.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Object.keys(nft.metadata).length > 0 ? (
                          <span className="flex items-center gap-1">
                            <FileJson className="h-3 w-3" />
                            {Object.keys(nft.metadata).length} traits
                          </span>
                        ) : (
                          'No metadata'
                        )}
                      </p>
                    </div>
                    {nft.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {nft.status === 'uploaded' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {nft.status === 'failed' && <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Help text */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>ZIP File Structure:</strong></p>
              <ul className="list-disc list-inside ml-2">
                <li>Include images (PNG, JPG, WEBP)</li>
                <li>Optional: Add matching JSON files for metadata</li>
                <li>Example: nft001.png + nft001.json</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
