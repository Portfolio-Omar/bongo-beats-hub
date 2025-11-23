import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Music, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PublicUpload = () => {
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 50MB",
          variant: "destructive",
        });
        return;
      }
      
      setAudioFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile || !songName || !artistName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select an audio file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('song-requests')
        .upload(fileName, audioFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('song-requests')
        .getPublicUrl(uploadData.path);

      // Insert song request record
      const { error: insertError } = await supabase
        .from('song_requests')
        .insert({
          song_name: songName,
          artist_name: artistName,
          audio_url: publicUrl,
          submitted_by_name: submitterName || null,
          submitted_by_email: submitterEmail || null,
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Upload successful!",
        description: "Your song has been submitted for review. Thank you for contributing!",
      });

      // Reset form
      setSongName('');
      setArtistName('');
      setSubmitterName('');
      setSubmitterEmail('');
      setAudioFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('audio-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your song. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
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
            Upload it to our community library and help preserve musical heritage!
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
                <Music className="h-8 w-8 text-gold-foreground" />
              </motion.div>
              <CardTitle className="text-2xl font-bold">Upload Song Request</CardTitle>
              <CardDescription className="text-base">
                Submit your song for admin review. Once approved, it will be added to our music library
                and available for everyone to enjoy.
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
                    <Label htmlFor="song-name" className="text-sm font-medium">Song Name *</Label>
                    <Input
                      id="song-name"
                      value={songName}
                      onChange={(e) => setSongName(e.target.value)}
                      placeholder="Enter song title"
                      className="h-12"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="artist-name" className="text-sm font-medium">Artist Name *</Label>
                    <Input
                      id="artist-name"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      placeholder="Enter artist name"
                      className="h-12"
                      required
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
                  <Label htmlFor="audio-file" className="text-sm font-medium">Audio File *</Label>
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="relative"
                    >
                      <Input
                        id="audio-file"
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                        className="h-16 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-gold file:to-yellow-600 file:text-gold-foreground hover:file:from-gold/90 hover:file:to-yellow-600/90 cursor-pointer"
                        required
                      />
                      <Upload className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    </motion.div>
                  </div>
                  {audioFile && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-lg bg-accent/10 border border-accent/20"
                    >
                      <p className="text-sm font-medium text-accent-foreground">
                        ✓ Selected: {audioFile.name} 
                        <span className="text-muted-foreground">
                          ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </p>
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
                          Uploading Your Song...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-3" />
                          Submit Song for Review
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