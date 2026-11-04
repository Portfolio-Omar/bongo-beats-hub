import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import VoiceRecorder from '@/components/community/VoiceRecorder';
import VoiceNotePlayer from '@/components/community/VoiceNotePlayer';
import type { ListenMessage } from '@/hooks/useListenSession';

interface SessionChatProps {
  messages: ListenMessage[];
  currentUserId: string | undefined;
  onSend: (text: string) => void;
  onSendVoice: (blob: Blob, duration: number) => void;
  className?: string;
}

const SessionChat: React.FC<SessionChatProps> = ({ messages, currentUserId, onSend, onSendVoice, className }) => {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const submit = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-2">
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-6">
              Say hi to everyone listening 👋
            </p>
          )}
          {messages.map((m) => {
            const mine = m.user_id === currentUserId;
            return (
              <div key={m.id} className={cn('flex gap-2', mine && 'flex-row-reverse')}>
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-muted shrink-0 flex items-center justify-center text-[10px] font-bold">
                    {m.user_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className={cn('max-w-[75%] rounded-2xl px-3 py-2 text-sm', mine ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  {!mine && <p className="text-[10px] font-semibold opacity-70 mb-0.5">{m.user_name}</p>}
                  {m.voice_url ? (
                    <VoiceNotePlayer url={m.voice_url} duration={m.voice_duration ?? undefined} isOwn={mine} />
                  ) : (
                    <p className="break-words whitespace-pre-wrap">{m.message}</p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="border-t border-border/40 p-2 flex items-center gap-2">
        <VoiceRecorder onRecordingComplete={onSendVoice} />
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Type a message..."
          className="h-9"
        />
        <Button size="icon" className="h-9 w-9 shrink-0" onClick={submit} disabled={!text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SessionChat;
