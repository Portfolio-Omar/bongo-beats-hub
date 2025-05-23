import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Upload, FileText, Trash2, Music, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, rpcFunctions } from '@/integrations/supabase/client';

interface SongUpload {
  file: File;
  title: string;
  artist: string;
  genre?: string;
  year?: string;
  coverFile?: File | null;
  uploading: boolean;
  progress: number;
  id?: string;
  error?: string;
}

const BatchUploadSongs: React.FC = () => {
  const [songUploads, setSongUploads] = useState<SongUpload[]>([]);
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleAddSongs = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newUploads: SongUpload[] = [];
    
    Array.from(e.target.files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return;
      }
      
      let title = '';
      let artist = '';
      
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      const splitName = fileName.split(' - ');
      
      if (splitName.length >= 2) {
        artist = splitName[0].trim();
        title = splitName[1].trim();
      } else {
        title = fileName;
      }
      
      newUploads.push({
        file,
        title,
        artist,
        uploading: false,
        progress: 0
      });
    });
    
    setSongUploads(prev => [...prev, ...newUploads]);
    
    e.target.value = '';
  };
  
  const handleAddCover = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Cover image is too large. Maximum size is 2MB.');
      return;
    }
    
    setSongUploads(prev => {
      const newUploads = [...prev];
      newUploads[index] = {
        ...newUploads[index],
        coverFile: file
      };
      return newUploads;
    });
    
    e.target.value = '';
  };
  
  const handleRemoveSong = (index: number) => {
    setSongUploads(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSongMetadataChange = (index: number, field: keyof SongUpload, value: string) => {
    setSongUploads(prev => {
      const newUploads = [...prev];
      (newUploads[index] as any)[field] = value;
      return newUploads;
    });
  };
  
  const checkSongExists = async (title: string, artist: string): Promise<boolean> => {
    try {
      return await rpcFunctions.checkSongExists(title, artist);
    } catch (error) {
      console.error('Unexpected error checking if song exists:', error);
      return false;
    }
  };
  
  const handleUploadAll = async () => {
    if (songUploads.length === 0) {
      toast.error('No songs to upload');
      return;
    }
    
    const incompleteUploads = songUploads.filter(song => !song.title || !song.artist);
    if (incompleteUploads.length > 0) {
      toast.error('Please fill in all required fields for all songs');
      return;
    }
    
    setIsUploading(true);
    
    for (let i = 0; i < songUploads.length; i++) {
      try {
        const songExists = await checkSongExists(songUploads[i].title, songUploads[i].artist);
        
        if (songExists) {
          setSongUploads(prev => {
            const newUploads = [...prev];
            newUploads[i] = {
              ...newUploads[i],
              error: 'A similar song already exists in the library'
            };
            return newUploads;
          });
          continue;
        }
        
        setSongUploads(prev => {
          const newUploads = [...prev];
          newUploads[i] = {
            ...newUploads[i],
            uploading: true,
            progress: 0
          };
          return newUploads;
        });
        
        const progressInterval = setInterval(() => {
          setSongUploads(prev => {
            const newUploads = [...prev];
            if (newUploads[i].progress >= 90) {
              clearInterval(progressInterval);
              return newUploads;
            }
            newUploads[i] = {
              ...newUploads[i],
              progress: newUploads[i].progress + 5
            };
            return newUploads;
          });
        }, 300);
        
        const audioFileName = `${Date.now()}-${songUploads[i].file.name}`;
        const { data: audioData, error: audioError } = await supabase
          .storage
          .from('music')
          .upload(audioFileName, songUploads[i].file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (audioError) {
          throw audioError;
        }
        
        const { data: audioUrl } = supabase
          .storage
          .from('music')
          .getPublicUrl(audioFileName);
          
        let coverUrl = null;
        if (songUploads[i].coverFile) {
          const coverFileName = `${Date.now()}-${songUploads[i].coverFile.name}`;
          const { data: coverData, error: coverError } = await supabase
            .storage
            .from('covers')
            .upload(coverFileName, songUploads[i].coverFile, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (coverError) {
            console.error('Error uploading cover image:', coverError);
          } else {
            const { data: coverUrlData } = supabase
              .storage
              .from('covers')
              .getPublicUrl(coverFileName);
              
            coverUrl = coverUrlData.publicUrl;
          }
        }
        
        const { data, error } = await supabase
          .from('songs')
          .insert({
            title: songUploads[i].title,
            artist: songUploads[i].artist,
            genre: songUploads[i].genre || null,
            year: songUploads[i].year || null,
            cover_url: coverUrl,
            audio_url: audioUrl.publicUrl,
            duration: '00:00',
            published: publishImmediately
          })
          .select();
          
        if (error) {
          throw error;
        }
        
        clearInterval(progressInterval);
        
        setSongUploads(prev => {
          const newUploads = [...prev];
          newUploads[i] = {
            ...newUploads[i],
            uploading: false,
            progress: 100,
            id: data?.[0]?.id
          };
          return newUploads;
        });
        
      } catch (error: any) {
        console.error(`Error uploading song ${i + 1}:`, error);
        
        setSongUploads(prev => {
          const newUploads = [...prev];
          newUploads[i] = {
            ...newUploads[i],
            uploading: false,
            error: error.message || 'Upload failed'
          };
          return newUploads;
        });
      }
    }
    
    setIsUploading(false);
    
    const failedUploads = songUploads.filter(song => song.error);
    const skippedDuplicates = songUploads.filter(song => song.error && song.error.includes('already exists'));
    
    if (failedUploads.length === 0) {
      toast.success(`Successfully uploaded ${songUploads.length} songs`);
      setTimeout(() => {
        setSongUploads([]);
      }, 3000);
    } else if (skippedDuplicates.length === failedUploads.length) {
      toast.warning(`${skippedDuplicates.length} duplicate songs were skipped.`);
      setSongUploads(prev => prev.filter(song => song.error && song.error.includes('already exists')));
    } else {
      toast.error(`${failedUploads.length - skippedDuplicates.length} uploads failed. Please check the errors and try again.`);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Batch Upload Songs
        </CardTitle>
        <CardDescription>Upload multiple songs at once</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="audio-files">Audio Files (Max 10MB each)</Label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="audio-files"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary border-border"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP3, WAV, OGG, or FLAC (MAX. 10MB each)
                  </p>
                </div>
                <input
                  id="audio-files"
                  type="file"
                  accept="audio/*"
                  multiple
                  className="hidden"
                  onChange={handleAddSongs}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Songs to Upload ({songUploads.length})</h3>
            
            {songUploads.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <Music className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                <p className="text-sm text-muted-foreground">No songs selected</p>
              </div>
            ) : (
              <div className="space-y-4">
                {songUploads.map((song, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <Music className="h-5 w-5 text-primary" />
                        <div className="font-medium truncate">{song.file.name}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSong(index)}
                        disabled={isUploading}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="space-y-2">
                        <Label htmlFor={`title-${index}`}>Title *</Label>
                        <input
                          id={`title-${index}`}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={song.title}
                          onChange={(e) => handleSongMetadataChange(index, 'title', e.target.value)}
                          placeholder="Song title"
                          disabled={isUploading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`artist-${index}`}>Artist *</Label>
                        <input
                          id={`artist-${index}`}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={song.artist}
                          onChange={(e) => handleSongMetadataChange(index, 'artist', e.target.value)}
                          placeholder="Artist name"
                          disabled={isUploading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`genre-${index}`}>Genre</Label>
                        <input
                          id={`genre-${index}`}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={song.genre || ''}
                          onChange={(e) => handleSongMetadataChange(index, 'genre', e.target.value)}
                          placeholder="Genre"
                          disabled={isUploading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`year-${index}`}>Year</Label>
                        <input
                          id={`year-${index}`}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={song.year || ''}
                          onChange={(e) => handleSongMetadataChange(index, 'year', e.target.value)}
                          placeholder="Year"
                          disabled={isUploading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <Label htmlFor={`cover-${index}`}>Cover Image (Optional, Max 2MB)</Label>
                      <div className="flex items-center gap-3">
                        {song.coverFile ? (
                          <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0 border border-border">
                            <img 
                              src={URL.createObjectURL(song.coverFile)} 
                              alt="Cover preview" 
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <label
                            htmlFor={`cover-${index}`}
                            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                          >
                            {song.coverFile ? 'Change Cover' : 'Add Cover'}
                          </label>
                          <input
                            id={`cover-${index}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleAddCover(index, e)}
                            disabled={isUploading}
                          />
                          {song.coverFile && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {song.coverFile.name} ({(song.coverFile.size / (1024 * 1024)).toFixed(2)} MB)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {song.uploading && (
                      <div className="w-full mt-2">
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all duration-300 ease-in-out"
                            style={{ width: `${song.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-center text-muted-foreground mt-1">
                          Uploading... {song.progress}%
                        </p>
                      </div>
                    )}
                    
                    {song.error && (
                      <p className="text-sm text-destructive mt-2">{song.error}</p>
                    )}
                    
                    {song.progress === 100 && !song.error && (
                      <p className="text-sm text-green-600 dark:text-green-500 mt-2">Upload complete</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {songUploads.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="publish-immediately" 
                checked={publishImmediately}
                onCheckedChange={(checked) => setPublishImmediately(!!checked)}
                disabled={isUploading}
              />
              <Label htmlFor="publish-immediately">Publish all songs immediately after upload</Label>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleUploadAll}
          disabled={isUploading || songUploads.length === 0}
        >
          {isUploading ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading {songUploads.filter(s => s.progress < 100).length} songs...
            </span>
          ) : (
            <span className="flex items-center">
              <Upload className="mr-2 h-4 w-4" />
              Upload {songUploads.length} songs
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BatchUploadSongs;
