import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Music, Send, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cleanSongName, parseArtistAndTitle } from '@/lib/song-name-cleaner';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface ParsedFile {
  file: File;
  songName: string;
  artistName: string;
}

const PublicUpload = () => {
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const { toast } = useToast();

  const parseFile = (file: File): ParsedFile => {
    const parsed = parseArtistAndTitle(file.name);
    return {
      file,
      songName: cleanSongName(parsed.title) || songName.trim(),
      artistName: parsed.artist || artistName.trim(),
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const valid: ParsedFile[] = [];
    let rejected = 0;

    for (const file of selected) {
      if (!file.type.startsWith('audio/')) {
        rejected++;
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected++;
        continue;
      }
      if (valid.length >= MAX_FILES) {
        rejected++;
        continue;
      }
      valid.push(parseFile(file));
    }

    if (rejected > 0) {
      toast({
        title: "Some files were skipped",
        description: `${rejected} file(s) skipped — only audio files under 50MB, up to ${MAX_FILES} at a time.`,
        variant: "destructive",
      });
    }

    setFiles(prev => {
      const merged = [...prev];
      for (const item of valid) {
        if (!merged.some(p => p.file.name === item.file.name && p.file.size === item.file.size)) {
          merged.push(item);
        }
      }
      return merged.slice(0, MAX_FILES);
    });
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one audio file",
        variant: "destructive",
      });
      return;
    }

    const missingDetails = files.filter(f => !f.songName.trim() || !f.artistName.trim());
    if (missingDetails.length > 0) {
      toast({
        title: "Missing song details",
        description: "Some filenames don't include a song name or artist. Fill in the Song Name and Artist Name fields (they'll be used for those files), or rename the files like 'Artist - Title.mp3'.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    const failed: Array<{ name: string; reason: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      setProgressText(`Uploading ${i + 1} of ${files.length}: ${item.songName}`);

      try {
        const fileExt = item.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('song-requests')
          .upload(fileName, item.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('song-requests')
          .getPublicUrl(uploadData.path);

        const { error: insertError } = await supabase
          .from('song_requests')
          .insert({
            song_name: item.songName,
            artist_name: item.artistName,
            audio_url: publicUrl,
            submitted_by_name: submitterName || null,
            submitted_by_email: submitterEmail || null,
          });

        if (insertError) throw insertError;
        successCount++;
      } catch (error) {
        console.error('Upload error:', error);
        failed.push({ name: item.file.name, reason: 'Upload or submission failed' });
      }
    }

    setIsUploading(false);
    setProgressText('');

    if (successCount > 0) {
      toast({
        title: `Uploaded ${successCount} of ${files.length} song${files.length > 1 ? 's' : ''}!`,
        description: "Your song(s) have been submitted for review. Thank you for contributing!",
      });
    }
    if (failed.length > 0) {
      toast({
        title: `${failed.length} upload(s) failed`,
        description: failed.map(f => f.name).join(', '),
        variant: "destructive",
      });
    }

    // Reset form
    setFiles([]);
    setSongName('');
    setArtistName('');
    setSubmitterName('');
    setSubmitterEmail('');
  };

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-background to-card">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-background to-gold/10" />

      {/* Floating music notes */}
      <motion.div
        className="absolute top-1/3 left-1/4 text-gold/30 text-4xl"
        animate={{ 
          y: [-20, 20, -20],
          rotate: [0, 10, 0]
        }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        ♪
      </motion.div>
      <motion.div
        className="absolute bottom-1/3 right-1/4 text-gold/30 text-3xl"
        animate={{ 
          y: [20, -20, 20],
          rotate: [0, -10, 0]
        }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      >
        ♫
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold-foreground font-medium text-sm mb-6 border border-gold/30"
            whileHover={{ scale: 1.05 }}
          >
            <Upload className="w-4 h-4" />
            Community Contribution
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-heading font-bold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent mb-4">
            Share Your Bongo Music
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Have a rare or classic Bongo song that deserves to be heard?
            Upload up to {MAX_FILES} songs at once to our community library and help preserve musical heritage!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="overflow-hidden border border-gold/30 shadow-2xl bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-xl">
            <CardHeader className="text-center pb-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center mb-4"
              >
                <Music className="h-8 h-8 text-gold-foreground" />
              </motion.div>
              <CardTitle className="text-2xl font-bold">Upload Song Request{files.length > 1 ? 's' : ''}</CardTitle>
              <CardDescription className="text-base">
                Submit up to {MAX_FILES} songs at a time for admin review. Song and artist names are read from the
                filenames (e.g. <span className="italic">Artist - Title.mp3</span>), or fill in the fields below for a single upload.
                Once approved, songs are added to our music library.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="song-name" className="text-sm font-medium">Song Name {files.length <= 1 ? '(fallback)' : '(used when a filename has no title)'}</Label>
                    <Input
                      id="song-name"
                      value={songName}
                      onChange={(e) => setSongName(e.target.value)}
                      placeholder="Enter song title"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="artist-name" className="text-sm font-medium">Artist Name {files.length <= 1 ? '(fallback)' : '(used when a filename has no artist)'}</Label>
                    <Input
                      id="artist-name"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      placeholder="Enter artist name"
                      className="h-12"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="submitter-name" className="text-sm font-medium">Your Name (Optional)</Label>
                    <Input
                      id="submitter-name"
                      value={submitterName}
                      onChange={(e) => setSubmitterName(e.target.value)}
                      placeholder="Your name"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="submitter-email" className="text-sm font-medium">Your Email (Optional)</Label>
                    <Input
                      id="submitter-email"
                      type="email"
                      value={submitterEmail}
                      onChange={(e) => setSubmitterEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="h-12"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <Label htmlFor="audio-file" className="text-sm font-medium">
                    Audio Files * <span className="text-muted-foreground font-normal">(up to {MAX_FILES} at a time, max 50MB each)</span>
                  </Label>
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="relative"
                    >
                      <Input
                        id="audio-file"
                        type="file"
                        accept="audio/*"
                        multiple
                        onChange={handleFileChange}
                        className="h-16 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-gold file:to-yellow-600 file:text-gold-foreground hover:file:from-gold/90 hover:file:to-yellow-600/90 cursor-pointer"
                      />
                      <Upload className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    </motion.div>
                  </div>

                  {files.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1"
                    >
                      <p className="text-sm font-medium">{files.length} file{files.length > 1 ? 's' : ''} selected</p>
                      {files.map((item, index) => (
                        <div key={`${item.file.name}-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {index + 1}. {item.songName || item.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.artistName ? `${item.artistName} · ` : ''}
                              {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          {!isUploading && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0 hover:text-destructive"
                              onClick={() => removeFile(index)}
                              aria-label={`Remove ${item.file.name}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="pt-4"
                >
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-14 text-lg font-heading font-medium bg-gradient-to-r from-gold to-yellow-600 hover:from-gold/90 hover:to-yellow-600/90 shadow-lg text-gold-foreground"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Upload className="animate-spin h-5 w-5 mr-3" />
                          {progressText || 'Uploading...'}
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-3" />
                          Submit {files.length > 1 ? `${files.length} Songs` : 'Song'} for Review
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default PublicUpload;
