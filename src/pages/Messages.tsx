import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Search, Music, MessageSquare, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  song_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const Messages: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchUsers, setSearchUsers] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/auth');
  }, [isAuthenticated]);

  // Get all users for search
  const { data: allUsers } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name, avatar_url');
      return (data || []).filter((p: any) => p.user_id !== user?.id) as UserProfile[];
    },
    enabled: !!user,
  });

  // Get conversations (unique users messaged)
  const { data: conversations } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('private_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (!data) return [];
      
      // Group by other user
      const userMap = new Map<string, Message>();
      for (const msg of data as Message[]) {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!userMap.has(otherId)) userMap.set(otherId, msg);
      }
      return Array.from(userMap.entries()).map(([userId, lastMsg]) => ({ userId, lastMsg }));
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  // Get messages for selected conversation
  const { data: messages } = useQuery({
    queryKey: ['messages', user?.id, selectedUser],
    queryFn: async () => {
      if (!user || !selectedUser) return [];
      const { data } = await supabase
        .from('private_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      // Mark as read
      if (data?.length) {
        await supabase.from('private_messages')
          .update({ is_read: true })
          .eq('sender_id', selectedUser)
          .eq('receiver_id', user.id)
          .eq('is_read', false);
      }
      return (data || []) as Message[];
    },
    enabled: !!user && !!selectedUser,
    refetchInterval: 3000,
  });

  // Get song details for shared songs
  const { data: sharedSongs } = useQuery({
    queryKey: ['shared-songs', messages],
    queryFn: async () => {
      const songIds = messages?.filter(m => m.song_id).map(m => m.song_id!) || [];
      if (!songIds.length) return {};
      const { data } = await supabase.from('songs').select('id, title, artist').in('id', songIds);
      const map: Record<string, { title: string; artist: string }> = {};
      data?.forEach((s: any) => { map[s.id] = { title: s.title, artist: s.artist }; });
      return map;
    },
    enabled: !!messages?.length,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getUserName = (userId: string) => {
    const profile = allUsers?.find(u => u.user_id === userId);
    return profile?.full_name || `User ${userId.slice(0, 6)}`;
  };

  const sendMessage = async () => {
    if (!user || !selectedUser || !messageText.trim()) return;
    
    const { error } = await supabase.from('private_messages').insert({
      sender_id: user.id,
      receiver_id: selectedUser,
      message: messageText.trim(),
    });

    if (error) {
      toast.error('Failed to send message');
      return;
    }

    // Award points for messaging
    await supabase.rpc('award_points', { _user_id: user.id, _points: 2, _action: 'message_sent' });
    
    setMessageText('');
    queryClient.invalidateQueries({ queryKey: ['messages'] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const filteredUsers = allUsers?.filter(u =>
    u.full_name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.user_id.includes(searchUsers)
  ) || [];

  const unreadCount = (userId: string) => {
    return conversations?.find(c => c.userId === userId)?.lastMsg.sender_id === userId && 
           !conversations?.find(c => c.userId === userId)?.lastMsg.is_read ? 1 : 0;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 py-8 pb-32">
      <h1 className="text-3xl font-heading font-bold mb-6 bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
        <MessageSquare className="inline-block mr-2 h-8 w-8 text-gold" />
        Messages
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        {/* Contacts sidebar */}
        <Card className="border-gold/20">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)}
                className="pl-10 bg-muted/50" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {searchUsers ? (
                filteredUsers.map(u => (
                  <button key={u.user_id} onClick={() => { setSelectedUser(u.user_id); setSearchUsers(''); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gold/20 text-gold">{(u.full_name || 'U')[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm truncate">{u.full_name || u.user_id.slice(0, 8)}</span>
                  </button>
                ))
              ) : (
                conversations?.map(c => (
                  <button key={c.userId} onClick={() => setSelectedUser(c.userId)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left ${selectedUser === c.userId ? 'bg-gold/10 border-l-2 border-gold' : ''}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gold/20 text-gold">{getUserName(c.userId)[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{getUserName(c.userId)}</span>
                        {unreadCount(c.userId) > 0 && <Badge className="bg-gold text-gold-foreground h-5 w-5 p-0 flex items-center justify-center text-[10px]">!</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.lastMsg.message || '🎵 Shared a song'}</p>
                    </div>
                  </button>
                ))
              )}
              {!searchUsers && (!conversations || conversations.length === 0) && (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Search for a user to start chatting</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="md:col-span-2 border-gold/20 flex flex-col">
          {selectedUser ? (
            <>
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedUser(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gold/20 text-gold">{getUserName(selectedUser)[0]}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg">{getUserName(selectedUser)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-3">
                    {messages?.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          msg.sender_id === user?.id 
                            ? 'bg-gold text-gold-foreground rounded-br-md' 
                            : 'bg-muted rounded-bl-md'
                        }`}>
                          {msg.message && <p className="text-sm">{msg.message}</p>}
                          {msg.song_id && sharedSongs?.[msg.song_id] && (
                            <div className="flex items-center gap-2 mt-1 p-2 rounded-lg bg-background/20">
                              <Music className="h-4 w-4" />
                              <div>
                                <p className="text-xs font-medium">{sharedSongs[msg.song_id].title}</p>
                                <p className="text-[10px] opacity-70">{sharedSongs[msg.song_id].artist}</p>
                              </div>
                            </div>
                          )}
                          <p className="text-[10px] opacity-60 mt-1">{format(new Date(msg.created_at), 'HH:mm')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t border-border/40 flex gap-2">
                  <Input placeholder="Type a message..." value={messageText} onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()} className="flex-1" />
                  <Button onClick={sendMessage} size="icon" className="bg-gold hover:bg-gold/90 text-gold-foreground">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">or search for a user to start chatting</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messages;
