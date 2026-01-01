import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, AlertCircle, CheckCircle2, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { parseFilename, FILENAME_FORMAT, groupByCategory, type ParsedFilename } from '@/lib/filename-parser';
import { supabase } from '@/integrations/supabase/client';
import { useCreateCategory, useCreateLayer, useCategories } from '@/hooks/use-project';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface LayerUploadZoneProps {
  projectId: string;
  onComplete: () => void;
}

interface FileWithParsed {
  file: File;
  parsed: ParsedFilename;
}

export function LayerUploadZone({ projectId, onComplete }: LayerUploadZoneProps) {
  const [files, setFiles] = useState<FileWithParsed[]>([]);
  const [invalidFiles, setInvalidFiles] = useState<{ file: File; error: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  
  const { data: existingCategories } = useCategories(projectId);
  const createCategory = useCreateCategory();
  const createLayer = useCreateLayer();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles: FileWithParsed[] = [];
    const invalid: { file: File; error: string }[] = [];

    for (const file of acceptedFiles) {
      if (!file.type.startsWith('image/png')) {
        invalid.push({ file, error: 'Only PNG files are allowed' });
        continue;
      }

      const parsed = parseFilename(file.name);
      if (parsed.isValid) {
        validFiles.push({ file, parsed });
      } else {
        invalid.push({ file, error: parsed.error || 'Invalid filename format' });
      }
    }

    setFiles((prev) => [...prev, ...validFiles]);
    setInvalidFiles((prev) => [...prev, ...invalid]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'] },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeInvalidFile = (index: number) => {
    setInvalidFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      const grouped = groupByCategory(files);
      const existingCategoryNames = new Set(existingCategories?.map((c) => c.name) || []);
      const categoryMap = new Map<string, string>(); // name -> id

      // Map existing categories
      for (const cat of existingCategories || []) {
        categoryMap.set(cat.name, cat.id);
      }

      // Create new categories with correct order from filenames
      for (const [categoryName, { minOrder }] of grouped) {
        if (!existingCategoryNames.has(categoryName)) {
          const result = await createCategory.mutateAsync({
            projectId,
            name: categoryName,
            displayName: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
            orderIndex: minOrder,
          });
          categoryMap.set(categoryName, result.id);
        }
      }

      // Upload files and create layers
      let uploadedCount = 0;
      for (const [categoryName, { files: categoryFiles }] of grouped) {
        const categoryId = categoryMap.get(categoryName);
        if (!categoryId) continue;

        for (const { file, parsed } of categoryFiles) {
          const storagePath = `${projectId}/${categoryName}/${file.name}`;
          
          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('layers')
            .upload(storagePath, file, { upsert: true });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          // Create layer record
          await createLayer.mutateAsync({
            categoryId,
            projectId,
            filename: file.name,
            traitName: parsed.trait,
            displayName: parsed.trait,
            storagePath,
            orderIndex: parsed.order,
          });

          uploadedCount++;
        }
      }

      toast({
        title: 'Upload complete',
        description: `${uploadedCount} layers uploaded successfully`,
      });

      setFiles([]);
      setInvalidFiles([]);
      onComplete();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const grouped = groupByCategory(files);

  return (
    <div className="space-y-6">
      {/* Format helper */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Info className="h-4 w-4 text-primary" />
            Filename Format
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <code className="rounded bg-muted px-2 py-1 text-sm">{FILENAME_FORMAT}</code>
          <p className="mt-2 text-sm text-muted-foreground">
            Example: <code className="text-foreground">00_body_warrior.png</code> → Category: body, Trait: warrior
          </p>
        </CardContent>
      </Card>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <p className="mb-1 font-medium">
          {isDragActive ? 'Drop files here' : 'Drag & drop PNG files'}
        </p>
        <p className="text-sm text-muted-foreground">or click to browse</p>
      </div>

      {/* Invalid files */}
      {invalidFiles.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4" />
              Invalid Files ({invalidFiles.length})
            </CardTitle>
            <CardDescription>These files don't match the required format</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-40">
              <div className="space-y-2">
                {invalidFiles.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileImage className="h-4 w-4 shrink-0 text-destructive" />
                      <span className="truncate text-sm">{item.file.name}</span>
                      <span className="text-xs text-destructive">{item.error}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeInvalidFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Valid files grouped by category */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Ready to Upload ({files.length} files)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-60">
              <div className="space-y-4">
                {Array.from(grouped.entries())
                  .sort(([, a], [, b]) => a.minOrder - b.minOrder)
                  .map(([category, { files: items, minOrder }]) => (
                  <div key={category}>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Layer {minOrder} · {items.length} traits
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {items.map(({ file, parsed }, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <div className="group relative rounded-md border border-border/50 bg-muted/30 p-2">
                              <button
                                className="absolute -right-1 -top-1 hidden rounded-full bg-destructive p-0.5 group-hover:block"
                                onClick={() =>
                                  removeFile(files.findIndex((f) => f.file === file))
                                }
                              >
                                <X className="h-3 w-3 text-destructive-foreground" />
                              </button>
                              <FileImage className="mx-auto mb-1 h-6 w-6 text-muted-foreground" />
                              <p className="truncate text-center text-xs">{parsed.trait}</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{file.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Upload button */}
      {files.length > 0 && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setFiles([])} disabled={uploading}>
            Clear all
          </Button>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload {files.length} files
          </Button>
        </div>
      )}
    </div>
  );
}
