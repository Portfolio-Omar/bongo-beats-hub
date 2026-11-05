import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Play, Pause, SkipBack, SkipForward, Users, Crown, Copy, Share2, Check,
  LogOut, Power, ListMusic, MessageSquare, Loader2, Music, Hash, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  useListenSession, joinListenSession, expectedPosition,
  REACTION_EMOJIS, type SongSnapshot,
} from '@/hooks/useListenSession';
import SongPicker from '@/components/listen/SongPicker';
import SessionChat from '@/components/listen/SessionChat';
import ParticipantList from '@/components/listen/ParticipantList';
import ReactionOverlay from '@/components/listen/ReactionOverlay';
import { cn } from '@/lib/utils';

const formatTime = (secs: number) => {
  if (!Number.isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const parseDuration = (d?: string | null): number => {
  if (!d) return 0;
  const parts = d.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
};

const ListenRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { audioRef } = useAudio();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [localTime, setLocalTime] = useState(0);
  const joinedRef = useRef(false);

  const {
    session, participants, messages, onlineIds, reactions, loading, error,
    isHost, playSongNow, toggleHostPlayback, seekHost, nextSong, previousSong,
    addToQueue, removeFromQueue, playQueueItem, transferHost, removeParticipant,
    endSession, leaveSession, sendReaction, sendMessage, sendVoice,
  } = useListenSession(joined ? (id ?? null) : null);

  // Join the session once on load
  useEffect(() => {
    if (!id || !user || joinedRef.current) return;
    joinedRef.current = true;
    joinListenSession(id, user).then((s) => {
      if (!s) {
        toast({ title: t('session_ended'), variant: 'destructive' });
        navigate('/listen');
      } else {
        setJoined(true);
      }
    });
  }, [id, user, navigate, toast, t]);

  // Local progress display for everyone (smooth ticking)
  useEffect(() => {
    const iv = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) setLocalTime(audio.currentTime);
      else if (session && !isHost) setLocalTime(expectedPosition(session));
      else if (session && isHost) setLocalTime(audio ? audio.currentTime : 0);
    }, 500);
    return () => clearInterval(iv);
  }, [session, isHost, audioRef]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-10 space-y-4">
            <Users className="h-10 w-10 mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">{t('listen_together_sign_in')}</p>
            <Button asChild className="bg-gold hover:bg-gold/90 text-gold-foreground">
              <a href="/auth">{t('sign_in')}</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !joined || !session) {
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-20">
          <Card className="max-w-md w-full text-center">
            <CardContent className="py-10 space-y-4">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => navigate('/listen')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> {t('listen_together')}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session.status === 'ended') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-10 space-y-4">
            <Power className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-heading text-xl font-bold">{t('session_ended')}</p>
            <Button onClick={() => navigate('/listen')}>{t('back_to_sessions')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const song = session.current_song;
  const songDuration = parseDuration(song?.duration) || 0;
  const onlineParticipants = participants.filter(p => onlineIds.has(p.user_id));
  const inviteLink = `${window.location.origin}/listen/${session.id}`;

  const copy = async (what: 'code' | 'link') => {
    const text = what === 'code' ? (session.code || '') : inviteLink;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  const shareSession = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: session.name, text: `Join me listening on Bongo Old Skool! Code: ${session.code}`, url: inviteLink });
      } catch {}
    } else {
      copy('link');
    }
  };

  const leave = async () => {
    await leaveSession();
    navigate('/listen');
  };

  const end = async () => {
    await endSession();
    navigate('/listen');
  };

  return (
    <div className="min-h-screen px-4 pt-24 pb-32">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate('/listen')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-2xl md:text-3xl font-bold truncate">{session.name}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Crown className="h-3 w-3 text-gold" /> {t('hosted_by')} {session.host_name}
              {isHost && <Badge variant="secondary" className="text-[10px] ml-1">{t('you_are_host')}</Badge>}
            </p>
          </div>
          <Badge variant="secondary" className="font-mono text-sm cursor-pointer" onClick={() => copy('code')} title={t('copy_code')}>
            {copied === 'code' ? <Check className="h-3.5 w-3.5 mr-1" /> : <Hash className="h-3.5 w-3.5 mr-1" />}
            {session.code}
          </Badge>
          <Button size="sm" variant="outline" onClick={shareSession} className="gap-1">
            <Share2 className="h-3.5 w-3.5" /> {t('invite')}
          </Button>
          {isHost ? (
            <Button size="sm" variant="destructive" onClick={end} className="gap-1">
              <Power className="h-3.5 w-3.5" /> {t('end_session')}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={leave} className="gap-1">
              <LogOut className="h-3.5 w-3.5" /> {t('leave_session')}
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Now playing + queue */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="relative overflow-hidden">
              <ReactionOverlay reactions={reactions} />
              <CardContent className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {song?.cover_url ? (
                    <img
                      src={song.cover_url}
                      alt=""
                      className={cn('h-40 w-40 rounded-xl object-cover shadow-lg border', session.is_playing && 'animate-pulse')}
                    />
                  ) : (
                    <div className="h-40 w-40 rounded-xl bg-muted flex items-center justify-center">
                      <Music className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{t('now_playing_together')}</p>
                    <h2 className="font-heading text-2xl font-bold truncate">{song?.title || t('nothing_playing')}</h2>
                    <p className="text-muted-foreground truncate">{song?.artist}</p>
                    {isHost && (
                      <div className="mt-3">
                        <SongPicker
                          onPlayNow={(s: SongSnapshot) => playSongNow(s)}
                          onAddToQueue={(s: SongSnapshot) => addToQueue(s)}
                          label={t('add_songs')}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <Slider
                    value={[Math.min(localTime, songDuration || localTime || 1)]}
                    max={songDuration || Math.max(localTime, 1)}
                    step={1}
                    disabled={!isHost || !song}
                    onValueChange={([v]) => seekHost(v)}
                    className="cursor-default"
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                    <span>{formatTime(localTime)}</span>
                    {songDuration > 0 && <span>{formatTime(songDuration)}</span>}
                  </div>
                </div>

                {/* Host controls */}
                {isHost && (
                  <div className="flex items-center justify-center gap-3">
                    <Button size="icon" variant="outline" className="rounded-full" onClick={previousSong} disabled={!song}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button size="icon" className="rounded-full h-12 w-12 bg-gold hover:bg-gold/90 text-gold-foreground" onClick={toggleHostPlayback} disabled={!song}>
                      {session.is_playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button size="icon" variant="outline" className="rounded-full" onClick={nextSong} disabled={session.queue.length === 0}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {!isHost && (
                  <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {t('host_controls_note')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Queue */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ListMusic className="h-4 w-4 text-primary" />
                  <h3 className="font-heading font-bold">{t('queue')}</h3>
                  <Badge variant="secondary" className="ml-auto">{session.queue.length}</Badge>
                </div>
                {session.queue.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">{t('queue_empty')}</p>
                ) : (
                  <div className="space-y-1">
                    {session.queue.map((q, i) => (
                      <div key={`${q.id}-${i}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/60">
                        {q.cover_url ? (
                          <img src={q.cover_url} alt="" className="h-9 w-9 rounded object-cover" />
                        ) : (
                          <div className="h-9 w-9 rounded bg-muted flex items-center justify-center"><Music className="h-3.5 w-3.5 text-muted-foreground" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{q.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{q.artist}</p>
                        </div>
                        {isHost && (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8" title={t('play_now')} onClick={() => playQueueItem(i)}>
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeFromQueue(i)}>
                              ✕
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat + People */}
          <div className="space-y-6">
            {/* Reaction bar */}
            <Card>
              <CardContent className="p-3">
                <p className="text-[11px] text-muted-foreground mb-2 text-center">{t('react_live')}</p>
                <div className="flex justify-center gap-1 flex-wrap">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className="h-9 w-9 rounded-full hover:bg-muted hover:scale-125 transition-all text-lg"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col h-[480px]">
              <Tabs defaultValue="chat" className="flex flex-col h-full">
                <TabsList className="grid grid-cols-2 mx-3 mt-3">
                  <TabsTrigger value="chat" className="gap-1 text-xs"><MessageSquare className="h-3.5 w-3.5" />{t('chat')}</TabsTrigger>
                  <TabsTrigger value="people" className="gap-1 text-xs">
                    <Users className="h-3.5 w-3.5" />{t('members')}
                    <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[10px]">{onlineParticipants.length}</Badge>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0 data-[state=inactive]:hidden">
                  <SessionChat
                    className="flex-1 min-h-0"
                    messages={messages}
                    currentUserId={user.id}
                    onSend={sendMessage}
                    onSendVoice={sendVoice}
                  />
                </TabsContent>
                <TabsContent value="people" className="flex-1 min-h-0 mt-0 overflow-auto data-[state=inactive]:hidden">
                  <ParticipantList
                    participants={participants}
                    hostId={session.host_id}
                    onlineIds={onlineIds}
                    currentUserId={user.id}
                    isHost={isHost}
                    onTransfer={transferHost}
                    onRemove={removeParticipant}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListenRoom;
