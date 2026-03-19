import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Pin, Trash2, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLiveChat } from '@/hooks/useLiveChat';

interface LiveChatProps {
  sessionId: string;
  isAdmin?: boolean;
}

const LiveChat: React.FC<LiveChatProps> = ({ sessionId, isAdmin = false }) => {
  const [input, setInput] = useState('');
  const { user } = useAuth();
  const { messages, pinnedMessage, sendMessage, deleteMessage, pinMessage } = useLiveChat(sessionId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !user) return;
    sendMessage(input, user.email?.split('@')[0] || 'User', user.id);
    setInput('');
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Live Chat
          <Badge variant="secondary" className="text-[10px]">{messages.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2 overflow-hidden p-3">
        {pinnedMessage && (
          <div className="bg-primary/10 border border-primary/20 rounded px-2 py-1 text-xs flex items-center gap-1">
            <Pin className="h-3 w-3 text-primary" />
            <span className="font-semibold">{pinnedMessage.user_name}:</span>
            <span className="truncate">{pinnedMessage.message}</span>
          </div>
        )}
        <ScrollArea className="flex-1">
          <div className="space-y-1 pr-2">
            {messages.map(msg => (
              <div key={msg.id} className="flex items-start gap-1 text-xs group hover:bg-accent/30 rounded px-1 py-0.5">
                <span className="font-semibold text-primary shrink-0">{msg.user_name}:</span>
                <span className="flex-1 text-foreground/80 break-words">{msg.message}</span>
                {isAdmin && (
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0">
                    <button onClick={() => pinMessage(msg)} className="text-muted-foreground hover:text-primary"><Pin className="h-3 w-3" /></button>
                    <button onClick={() => deleteMessage(msg.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {user ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="h-8 text-xs"
            />
            <Button type="submit" size="icon" className="h-8 w-8 shrink-0">
              <Send className="h-3 w-3" />
            </Button>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground text-center">Sign in to chat</p>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveChat;
