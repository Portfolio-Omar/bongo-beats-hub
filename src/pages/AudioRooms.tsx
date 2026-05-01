import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Headphones, Users, Plus, LogIn, LogOut, Send, Crown, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AudioRoom {
  id: string;
  name: string;
  description: string | null;
  host_id: string;
  is_active: boolean;
  participant_count: number;
  created_at: string;
}

interface Participant { id: string; user_id: string; user_name: string; }
interface RoomMessage { id: string; user_id: string; user_name: string; message: string; created_at: string; }

const AudioRooms: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [chatInput, setChatInput] = useState('');

  const { data: rooms = [] } = useQuery({
    queryKey: ['audio-rooms'],
    queryFn: async () => {
      const { data } = await supabase.from('audio_rooms').select('*').eq('is_active', true).order('created_at', { ascending: false });
      return (data || []) as AudioRoom[];
    },
    refetchInterval: 5000,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['room-participants', activeRoomId],
    queryFn: async () => {
      if (!activeRoomId) return [];
      const { data } = await supabase.from('audio_room_participants').select('*').eq('room_id', activeRoomId);
      return (data || []) as Participant[];
    },
    enabled: !!activeRoomId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['room-messages', activeRoomId],
    queryFn: async () => {
      if (!activeRoomId) return [];
      const { data } = await supabase.from('audio_room_messages').select('*').eq('room_id', activeRoomId).order('created_at', { ascending: true }).limit(100);
      return (data || []) as RoomMessage[];
    },
    enabled: !!activeRoomId,
  });

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  // Realtime for active room
  useEffect(() => {
    if (!activeRoomId) return;
    const ch = supabase
      .channel(`room-${activeRoomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_room_messages', filter: `room_id=eq.${activeRoomId}` },
        () => queryClient.invalidateQueries({ queryKey: ['room-messages', activeRoomId] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_room_participants', filter: `room_id=eq.${activeRoomId}` },
        () => queryClient.invalidateQueries({ queryKey: ['room-participants', activeRoomId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeRoomId, queryClient]);

  const createRoom = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!newRoomName.trim()) { toast.error('Enter a room name'); return; }
    const { data, error } = await supabase.from('audio_rooms').insert({
      name: newRoomName.trim(),
      description: newRoomDesc.trim() || null,
      host_id: user.id,
    }).select().single();
    if (error || !data) { toast.error('Failed to create room'); return; }
    toast.success('🎧 Room created!');
    setNewRoomName(''); setNewRoomDesc('');
    queryClient.invalidateQueries({ queryKey: ['audio-rooms'] });
    joinRoom(data.id);
  };

  const joinRoom = async (roomId: string) => {
    if (!user) { navigate('/auth'); return; }
    await supabase.from('audio_room_participants').upsert({
      room_id: roomId, user_id: user.id,
      user_name: user.email?.split('@')[0] || 'Listener',
    }, { onConflict: 'room_id,user_id' });
    setActiveRoomId(roomId);
  };

  const leaveRoom = async () => {
    if (!user || !activeRoomId) return;
    await supabase.from('audio_room_participants').delete().eq('room_id', activeRoomId).eq('user_id', user.id);
    setActiveRoomId(null);
  };

  const closeRoom = async (roomId: string) => {
    await supabase.from('audio_rooms').update({ is_active: false }).eq('id', roomId);
    if (activeRoomId === roomId) setActiveRoomId(null);
    queryClient.invalidateQueries({ queryKey: ['audio-rooms'] });
  };

  const sendChatMessage = async () => {
    if (!user || !activeRoomId || !chatInput.trim()) return;
    await supabase.from('audio_room_messages').insert({
      room_id: activeRoomId, user_id: user.id,
      user_name: user.email?.split('@')[0] || 'Listener',
      message: chatInput.trim(),
    });
    setChatInput('');
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 pb-32">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Headphones className="h-8 w-8 text-primary" /> Audio Rooms
        </h1>
        <p className="text-muted-foreground mt-1">Listen together, chat in real time</p>
      </div>

      {/* Create room */}
      {isAuthenticated && !activeRoomId && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create a Room
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="Room name" className="h-9" />
            <Input value={newRoomDesc} onChange={e => setNewRoomDesc(e.target.value)} placeholder="Description (optional)" className="h-9" />
            <Button onClick={createRoom} className="h-9"><Plus className="h-4 w-4 mr-1" /> Create & Join</Button>
          </CardContent>
        </Card>
      )}

      {/* Active room */}
      {activeRoom && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Headphones className="h-4 w-4 text-primary animate-pulse" />
                {activeRoom.name}
                <Badge variant="secondary" className="text-xs"><Users className="h-3 w-3 mr-1" />{participants.length}</Badge>
              </CardTitle>
              <div className="flex gap-2">
                {user?.id === activeRoom.host_id && (
                  <Button size="sm" variant="outline" onClick={() => closeRoom(activeRoom.id)}>
                    <X className="h-3 w-3 mr-1" /> Close Room
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={leaveRoom}>
                  <LogOut className="h-3 w-3 mr-1" /> Leave
                </Button>
              </div>
            </div>
            {activeRoom.description && <p className="text-xs text-muted-foreground">{activeRoom.description}</p>}
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <div className="text-xs font-bold mb-2 text-muted-foreground">PARTICIPANTS</div>
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-accent/30">
                      {p.user_id === activeRoom.host_id && <Crown className="h-3 w-3 text-gold" />}
                      <span className="truncate">{p.user_name}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="md:col-span-2 flex flex-col">
              <div className="text-xs font-bold mb-2 text-muted-foreground">ROOM CHAT</div>
              <ScrollArea className="h-56 mb-2 border border-border/40 rounded p-2">
                <div className="space-y-1">
                  {messages.map(m => (
                    <div key={m.id} className="text-xs">
                      <span className="font-semibold text-primary">{m.user_name}:</span>{' '}
                      <span>{m.message}</span>
                    </div>
                  ))}
                  {messages.length === 0 && <p className="text-xs text-muted-foreground text-center">Say hi 👋</p>}
                </div>
              </ScrollArea>
              <div className="flex gap-1">
                <Input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..." className="h-8 text-xs" />
                <Button size="icon" className="h-8 w-8" onClick={sendChatMessage}><Send className="h-3 w-3" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room list */}
      <div>
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Active Rooms
        </h2>
        {rooms.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Headphones className="h-12 w-12 mx-auto opacity-30 mb-3" />
            <p>No active rooms. Create one to get started!</p>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rooms.map(room => (
              <Card key={room.id} className={`hover:border-primary/40 transition-colors ${activeRoomId === room.id ? 'border-primary' : ''}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{room.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />{room.participant_count}
                    </Badge>
                  </div>
                  {room.description && <p className="text-xs text-muted-foreground line-clamp-2">{room.description}</p>}
                  <Button size="sm" className="w-full" disabled={activeRoomId === room.id}
                    onClick={() => joinRoom(room.id)}>
                    <LogIn className="h-3 w-3 mr-1" /> {activeRoomId === room.id ? 'Joined' : 'Join Room'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRooms;
