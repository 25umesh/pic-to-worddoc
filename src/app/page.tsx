
'use client';

import { useState, useMemo, useEffect, DragEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { FileImage, Upload, FileDown, Loader2, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateDocx } from '@/lib/docx-generator';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type FileWithPreview = {
  file: File;
  preview: string;
  manualNumber?: string;
};

type NumberingOption = 'none' | 'auto' | 'manual';

export default function Home() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [numbering, setNumbering] = useState<NumberingOption>('none');
  const [showFilename, setShowFilename] = useState(false);
  const { toast } = useToast();

  const handleFiles = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles)
        .filter((file) => file.type.startsWith('image/'))
        .map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          manualNumber: '',
        }));
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Reset input to allow re-selecting the same file
  };
  
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };
  
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      const [removedFile] = newFiles.splice(index, 1);
      URL.revokeObjectURL(removedFile.preview);
      return newFiles;
    });
  };

  const handleManualNumberChange = (index: number, value: string) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      newFiles[index].manualNumber = value;
      return newFiles;
    });
  };

  const clearAll = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  const handleGenerate = async () => {
    if (files.length === 0) {
      toast({
        title: 'No Images Selected',
        description: 'Please select some images before generating the document.',
        variant: 'destructive',
      });
      return;
    }
    setIsGenerating(true);
    try {
      const imageDetails = files.map((f, index) => {
        let number: string | undefined;
        if (numbering === 'auto') {
          number = (index + 1).toString();
        } else if (numbering === 'manual') {
          number = f.manualNumber || undefined;
        }
        return { 
          file: f.file, 
          number,
          filename: showFilename ? f.file.name : undefined,
        };
      });
      await generateDocx(imageDetails);
    } catch (error) {
      console.error('Failed to generate document:', error);
      toast({
        title: 'Generation Failed',
        description: 'Something went wrong while creating the document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const pages = useMemo(() => {
    const pagesArray = [];
    for (let i = 0; i < files.length; i += 6) {
      pagesArray.push(files.slice(i, i + 6));
    }
    return pagesArray;
  }, [files]);

  return (
    <main className="min-h-screen bg-background font-body p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <FileImage className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold font-headline tracking-tight">PicPage Pro</h1>
          </div>
          <p className="text-muted-foreground mt-2 text-lg">
            Easily convert your images into a professionally formatted Word document.
          </p>
        </header>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Image Uploader</CardTitle>
            <CardDescription>Select up to 6 images per page for your document.</CardDescription>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full p-12 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/80 transition-colors",
                  isDragging ? "border-primary bg-primary/10" : "border-border"
                )}
              >
                <label htmlFor="file-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold">Click to upload or drag and drop</p>
                  <p className="text-muted-foreground">PNG, JPG, GIF, WEBP supported</p>
                </label>
                 <input id="file-upload" type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h3 className="font-semibold">{files.length} image(s) selected</h3>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="numbering-select">Numbering</Label>
                      <Select value={numbering} onValueChange={(value: string) => setNumbering(value as NumberingOption)}>
                        <SelectTrigger id="numbering-select" className="w-[180px]">
                          <SelectValue placeholder="Select numbering" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="auto">Automatic</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="show-filename" checked={showFilename} onCheckedChange={(checked) => setShowFilename(Boolean(checked))} />
                      <label
                        htmlFor="show-filename"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Show filenames
                      </label>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    <X className="mr-2 h-4 w-4" /> Clear All
                  </Button>
                </div>
                <ScrollArea className="h-[500px] w-full p-4 border rounded-lg bg-secondary/30">
                  <div className="space-y-8">
                    {pages.map((page, pageIndex) => (
                      <div key={pageIndex}>
                        <p className="text-sm font-semibold text-center text-muted-foreground mb-2">
                          Page {pageIndex + 1} of {pages.length}
                        </p>
                        <div className="bg-white dark:bg-card p-4 shadow-md rounded-md aspect-[1/1.414] mx-auto max-w-[400px]">
                          <div className="grid grid-cols-2 grid-rows-3 gap-2 h-full">
                            {[...Array(6)].map((_, imgIndex) => {
                              const fileWithPreview = page[imgIndex];
                              const globalIndex = pageIndex * 6 + imgIndex;
                              return fileWithPreview ? (
                                <div key={fileWithPreview.preview} className="relative group w-full h-full bg-muted rounded overflow-hidden flex flex-col items-center justify-center">
                                  <div className="absolute top-1 text-center w-full z-10">
                                  {(numbering === 'auto' || (numbering === 'manual' && fileWithPreview.manualNumber)) && (
                                    <div className="text-black text-xs font-bold bg-white/50 rounded-full inline-block px-1.5 py-0.5">
                                      {numbering === 'auto' ? globalIndex + 1 : fileWithPreview.manualNumber}
                                    </div>
                                  )}
                                  </div>
                                  <Image
                                    src={fileWithPreview.preview}
                                    alt={`Preview ${globalIndex + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                   <div className="absolute bottom-0 text-center w-full z-10 p-1">
                                    {showFilename && (
                                      <div className="text-white text-[8px] font-semibold bg-black/50 rounded-sm inline-block px-1 py-0.5 truncate max-w-full">
                                        {fileWithPreview.file.name}
                                      </div>
                                    )}
                                  </div>
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                    {numbering === 'manual' && (
                                      <div className="absolute top-0 left-0 right-0 p-1">
                                        <Input
                                          type="text"
                                          placeholder="#"
                                          value={fileWithPreview.manualNumber || ''}
                                          onChange={(e) => handleManualNumberChange(globalIndex, e.target.value)}
                                          className="h-7 text-xs w-full bg-white/80"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    )}
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => removeFile(globalIndex)}
                                      aria-label="Remove image"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div key={imgIndex} className="bg-muted/50 rounded flex items-center justify-center">
                                  <FileImage className="text-muted-foreground/50 w-8 h-8" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-stretch sm:flex-row justify-between gap-4">
            <Alert variant="default" className="sm:max-w-md">
              <AlertCircle className="h-4 w-4"/>
              <AlertTitle>Tip</AlertTitle>
              <AlertDescription>
                Images will be arranged 6 per page in a 2x3 grid in the final document.
              </AlertDescription>
            </Alert>
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating || files.length === 0}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-5 w-5" />
              )}
              Generate & Download .docx
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
