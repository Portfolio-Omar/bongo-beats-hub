import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send, Image as ImageIcon, Paperclip, X, Reply,
  Loader2, Download, MessageCircle, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import ImageViewerModal from '@/components/community/ImageViewerModal';
import VoiceRecorder from '@/components/community/VoiceRecorder';
import VoiceNotePlayer from '@/components/community/VoiceNotePlayer';
import MessageReactions from '@/components/community/MessageReactions';

interface Message {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  message: string | null;
  image_url: string | null;
  file_url: string | null;
  file_name: string | null;
  voice_url: string | null;
  voice_duration: number | null;
  reply_to_id: string | null;
  created_at: string;
  reply_to?: Message | null;
}

interface Participant {
  user_id: string;
  user_name: string;
  user_avatar: string | null;
}

const Community: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number>(0);
  const [swipingMessageId, setSwipingMessageId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<any>(null);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('community-messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            if (newMsg.reply_to_id) {
              newMsg.reply_to = prev.find(m => m.id === newMsg.reply_to_id) || null;
            }
            return [...prev, newMsg];
          });
          setParticipants(prev => {
            if (prev.find(p => p.user_id === newMsg.user_id)) return prev;
            return [...prev, { user_id: newMsg.user_id, user_name: newMsg.user_name, user_avatar: newMsg.user_avatar }];
          });
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'community_messages' },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Typing indicator via Presence
  useEffect(() => {
    if (!user) return;
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const presenceChannel = supabase.channel('community-typing', {
      config: { presence: { key: user.id } },
    });

    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      const typers: string[] = [];
      Object.entries(state).forEach(([uid, presences]: [string, any]) => {
        if (uid !== user.id && presences?.[0]?.typing) {
          typers.push(presences[0].name || 'Someone');
        }
      });
      setTypingUsers(typers);
    });

    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ typing: false, name: userName });
      }
    });

    presenceChannelRef.current = presenceChannel;
    return () => { supabase.removeChannel(presenceChannel); };
  }, [user]);

  const sendTypingIndicator = useCallback(() => {
    if (!presenceChannelRef.current || !user) return;
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    presenceChannelRef.current.track({ typing: true, name: userName });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      presenceChannelRef.current?.track({ typing: false, name: userName });
    }, 2000);
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    // Use timeout to ensure DOM has updated
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('community_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(200);

    if (data) {
      const messagesWithReplies = data.map((msg: any) => {
        if (msg.reply_to_id) {
          msg.reply_to = data.find((m: any) => m.id === msg.reply_to_id) || null;
        }
        return msg as Message;
      });
      setMessages(messagesWithReplies);

      // Extract unique participants
      const uniqueParticipants = new Map<string, Participant>();
      data.forEach((msg: any) => {
        if (!uniqueParticipants.has(msg.user_id)) {
          uniqueParticipants.set(msg.user_id, {
            user_id: msg.user_id,
            user_name: msg.user_name,
            user_avatar: msg.user_avatar,
          });
        }
      });
      setParticipants(Array.from(uniqueParticipants.values()));
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    setSelectedFile(file);
    if (isImage && file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const uploadFile = async (file: File | Blob, fileName?: string): Promise<{ url: string }> => {
    const ext = fileName ? fileName.split('.').pop() : 'webm';
    const path = `${user!.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('community-uploads')
      .upload(path, file);
    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('community-uploads')
      .getPublicUrl(path);

    return { url: urlData.publicUrl };
  };

  const handleSend = async (voiceBlob?: Blob, voiceDuration?: number) => {
    if (!isAuthenticated || !user) {
      toast.error('Please sign in to send messages');
      return;
    }

    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage && !selectedFile && !voiceBlob) return;

    setSending(true);
    let imageUrl: string | null = null;
    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let voiceUrl: string | null = null;

    try {
      if (voiceBlob) {
        const { url } = await uploadFile(voiceBlob, 'voice.webm');
        voiceUrl = url;
      } else if (selectedFile) {
        const { url } = await uploadFile(selectedFile, selectedFile.name);
        if (selectedFile.type.startsWith('image/')) {
          imageUrl = url;
        } else {
          fileUrl = url;
          fileName = selectedFile.name;
        }
      }

      const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

      const { error } = await supabase.from('community_messages').insert({
        user_id: user.id,
        user_name: userName,
        user_avatar: user.user_metadata?.avatar_url || null,
        message: trimmedMessage || null,
        image_url: imageUrl,
        file_url: fileUrl,
        file_name: fileName,
        voice_url: voiceUrl,
        voice_duration: voiceDuration || null,
        reply_to_id: replyTo?.id || null,
      });

      if (error) throw error;

      setNewMessage('');
      setReplyTo(null);
      clearFile();
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleVoiceRecordingComplete = (blob: Blob, duration: number) => {
    handleSend(blob, duration);
  };

  const handleTouchStart = (e: React.TouchEvent, message: Message) => {
    if (message.user_id === user?.id) return;
    touchStartX.current = e.touches[0].clientX;
    setSwipingMessageId(message.id);
  };

  const handleTouchMove = (e: React.TouchEvent, message: Message) => {
    if (swipingMessageId !== message.id) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (diff > 60) {
      setReplyTo(message);
      setSwipingMessageId(null);
    }
  };

  const handleTouchEnd = () => {
    setSwipingMessageId(null);
  };

  const isOwnMessage = (msg: Message) => msg.user_id === user?.id;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <MessageCircle className="h-16 w-16 mx-auto mb-4 text-primary/50" />
        <h2 className="text-2xl font-bold mb-2">Join the Community</h2>
        <p className="text-muted-foreground mb-6">Sign in to chat with other Bongo Flava fans</p>
        <Button asChild>
          <Link to="/auth">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Bongo Community Chat</h1>
          <p className="text-sm text-muted-foreground">Talk about music, artists & more</p>
        </div>
        {/* Participant Avatars */}
        <div className="flex items-center -space-x-2">
          {participants.slice(0, 5).map((p) => (
            <Avatar key={p.user_id} className="h-7 w-7 border-2 border-background">
              <AvatarImage src={p.user_avatar || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                {p.user_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {participants.length > 5 && (
            <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
              <span className="text-[10px] font-semibold text-muted-foreground">+{participants.length - 5}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'flex gap-2',
                    isOwnMessage(msg) ? 'flex-row-reverse' : 'flex-row'
                  )}
                  onTouchStart={(e) => handleTouchStart(e, msg)}
                  onTouchMove={(e) => handleTouchMove(e, msg)}
                  onTouchEnd={handleTouchEnd}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={msg.user_avatar || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {msg.user_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2',
                    isOwnMessage(msg)
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted rounded-tl-sm'
                  )}>
                    {!isOwnMessage(msg) && (
                      <p className="text-xs font-semibold mb-1 opacity-80">{msg.user_name}</p>
                    )}

                    {/* Reply Preview */}
                    {msg.reply_to && (
                      <div className={cn(
                        'text-xs mb-2 pl-2 border-l-2 opacity-70',
                        isOwnMessage(msg) ? 'border-primary-foreground/50' : 'border-primary/50'
                      )}>
                        <span className="font-semibold">{msg.reply_to.user_name}</span>
                        <p className="truncate">{msg.reply_to.message || '📎 Attachment'}</p>
                      </div>
                    )}

                    {/* Image */}
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt="Shared"
                        className="rounded-lg max-w-full mb-2 cursor-pointer"
                        onClick={() => setViewerImage(msg.image_url)}
                      />
                    )}

                    {/* Voice Note */}
                    {msg.voice_url && (
                      <VoiceNotePlayer
                        url={msg.voice_url}
                        duration={msg.voice_duration || undefined}
                        isOwn={isOwnMessage(msg)}
                      />
                    )}

                    {/* File */}
                    {msg.file_url && (
                      <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg mb-2',
                          isOwnMessage(msg) ? 'bg-primary-foreground/10' : 'bg-background'
                        )}
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="text-sm truncate">{msg.file_name}</span>
                        <Download className="h-4 w-4 ml-auto" />
                      </a>
                    )}

                    {/* Message */}
                    {msg.message && (
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    )}

                    <p className={cn(
                      'text-[10px] mt-1',
                      isOwnMessage(msg) ? 'text-primary-foreground/60' : 'text-muted-foreground'
                    )}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </p>
                  </div>

                  {/* Reply button for desktop */}
                  {!isOwnMessage(msg) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 hover:opacity-100 transition-opacity self-center"
                      onClick={() => setReplyTo(msg)}
                    >
                      <Reply className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 p-2 bg-muted rounded-lg mb-2"
          >
            <Reply className="h-4 w-4 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">{replyTo.user_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {replyTo.message || (replyTo.voice_url ? '🎤 Voice note' : '📎 Attachment')}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo(null)}>
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 p-2 bg-muted rounded-lg mb-2"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="h-12 w-12 rounded object-cover" />
            ) : (
              <div className="h-12 w-12 bg-primary/10 rounded flex items-center justify-center">
                <Paperclip className="h-5 w-5 text-primary" />
              </div>
            )}
            <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearFile}>
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, true)} />
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileSelect(e, false)} />

        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => imageInputRef.current?.click()} disabled={sending}>
          <ImageIcon className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()} disabled={sending}>
          <Paperclip className="h-5 w-5" />
        </Button>

        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={sending}
          className="flex-1"
        />

        {newMessage.trim() || selectedFile ? (
          <Button size="icon" onClick={() => handleSend()} disabled={sending}>
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        ) : (
          <VoiceRecorder onRecordingComplete={handleVoiceRecordingComplete} disabled={sending} />
        )}
      </div>

      {/* Image Viewer Modal */}
      <ImageViewerModal imageUrl={viewerImage} onClose={() => setViewerImage(null)} />
    </div>
  );
};

export default Community;
