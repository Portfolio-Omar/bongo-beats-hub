import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageCircle, X, Send, Loader2, Play, Download, 
  Plus, Bot, User, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/context/AudioContext';
import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/types/music';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  songs?: Song[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hello! I'm your Bongo Vibes assistant. I can help you:\n\n- **Find songs** by title, artist, or genre\n- **Navigate** the website\n- **Answer questions** about our music collection\n\nTry asking me something like \"Find songs by Diamond Platnumz\" or \"What genres do you have?\""
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { playSong, addToQueue } = useAudio();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const searchSongs = async (query: string): Promise<Song[]> => {
    const searchTerms = query.toLowerCase();
    
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('published', true)
      .or(`title.ilike.%${searchTerms}%,artist.ilike.%${searchTerms}%,genre.ilike.%${searchTerms}%`)
      .limit(5);

    if (error) {
      console.error('Search error:', error);
      return [];
    }

    return data || [];
  };

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Check if user is searching for songs
      const searchKeywords = ['find', 'search', 'play', 'song', 'artist', 'music', 'looking for', 'give me', 'show me'];
      const isSearchQuery = searchKeywords.some(keyword => 
        input.toLowerCase().includes(keyword)
      );

      let foundSongs: Song[] = [];
      if (isSearchQuery) {
        foundSongs = await searchSongs(input);
      }

      // Call AI for response
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/music-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          foundSongs: foundSongs.map(s => ({ title: s.title, artist: s.artist, genre: s.genre }))
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          throw new Error('Too many requests. Please try again in a moment.');
        }
        if (resp.status === 402) {
          throw new Error('Service temporarily unavailable. Please try again later.');
        }
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        songs: foundSongs.length > 0 ? foundSongs : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => 
                prev.map(m => 
                  m.id === assistantMessage.id 
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Ensure final message has songs attached
      setMessages(prev => 
        prev.map(m => 
          m.id === assistantMessage.id 
            ? { ...m, content: assistantContent, songs: foundSongs.length > 0 ? foundSongs : undefined }
            : m
        )
      );

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handlePlaySong = async (song: Song) => {
    try {
      const { data } = await supabase
        .from('songs')
        .select('*')
        .eq('published', true);
      
      playSong(song, data || [song]);
      toast.success(`Now playing: ${song.title}`);
    } catch {
      playSong(song, [song]);
    }
  };

  const handleAddToQueue = (song: Song) => {
    addToQueue(song);
    toast.success(`Added "${song.title}" to queue`);
  };

  const handleDownload = async (song: Song) => {
    try {
      await supabase.from('songs').update({ download_count: (song.download_count || 0) + 1 }).eq('id', song.id);
      const link = document.createElement('a');
      link.href = song.audio_url;
      link.download = `${song.artist} - ${song.title}.mp3`;
      link.click();
      toast.success(`Download started: ${song.title}`);
    } catch {
      toast.error('Failed to download');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 right-4 z-40"
          >
            <Button
              size="lg"
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 z-40 w-[90vw] max-w-md"
          >
            <Card className="border-border/50 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-primary p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-foreground">Bongo Vibes AI</h3>
                    <p className="text-xs text-primary-foreground/70">Ask me anything about music</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-primary-foreground hover:bg-background/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="h-96 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block rounded-2xl px-4 py-2 max-w-[85%] ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        </div>

                        {/* Song Results */}
                        {message.songs && message.songs.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.songs.map((song) => (
                              <motion.div
                                key={song.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50"
                              >
                                <img
                                  src={song.cover_url || '/placeholder.svg'}
                                  alt=""
                                  className="w-12 h-12 rounded object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{song.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handlePlaySong(song)}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handleAddToQueue(song)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handleDownload(song)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-1">
                          <motion.div
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <CardContent className="p-4 border-t border-border/50">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about songs, artists, or features..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="flex-shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
