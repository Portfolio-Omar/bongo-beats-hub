import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useAudio } from '@/context/AudioContext';
import type { Song } from '@/types/music';

// ================= Types =================

export interface SongSnapshot {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url?: string | null;
  duration?: string | null;
}

export interface ListenSessionState {
  id: string;
  code: string | null;
  name: string;
  host_id: string;
  host_name: string;
  current_song: SongSnapshot | null;
  queue: SongSnapshot[];
  is_playing: boolean;
  position_seconds: number;
  state_updated_at: string;
  status: string;
  created_at: string;
}

export interface ListenParticipant {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  is_host: boolean;
  joined_at: string;
  last_seen_at: string;
}

export interface ListenMessage {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  message: string | null;
  voice_url: string | null;
  voice_duration: number | null;
  created_at: string;
}

export interface ReactionEvent {
  id: number;
  emoji: string;
  user_name: string;
  mine: boolean;
}

// ================= Constants =================

const HOST_POSITION_SYNC_MS = 5000; // how often the host broadcasts its exact position
const DRIFT_CHECK_MS = 2500;        // how often guests correct drift
const DRIFT_TOLERANCE_S = 2;        // allowed drift before guest re-seeks
const HEARTBEAT_MS = 25000;         // presence heartbeat
const STALE_SESSION_MS = 3 * 60 * 60 * 1000; // lobby shows sessions active in the last 3h

export const REACTION_EMOJIS = ['❤️', '🔥', '😂', '😮', '😢', '👏', '🎶', '💃'];

// ================= Helpers =================

export const snapshotSong = (s: Song): SongSnapshot => ({
  id: s.id,
  title: s.title,
  artist: s.artist,
  audio_url: s.audio_url,
  cover_url: s.cover_url,
  duration: s.duration,
});

export const toSong = (snap: SongSnapshot): Song => ({
  id: snap.id,
  title: snap.title,
  artist: snap.artist,
  genre: '',
  year: '',
  duration: snap.duration || '',
  audio_url: snap.audio_url,
  cover_url: snap.cover_url || '',
  created_at: '',
  published: true,
  download_count: 0,
});

/** Where playback should be right now, extrapolated from the host's last sync. */
export const expectedPosition = (s: ListenSessionState | null): number => {
  if (!s) return 0;
  const base = Number(s.position_seconds) || 0;
  if (!s.is_playing) return base;
  const elapsed = (Date.now() - new Date(s.state_updated_at).getTime()) / 1000;
  return base + Math.max(0, elapsed);
};

interface RawSession {
  id: string;
  code: string | null;
  name: string;
  host_id: string;
  host_name: string;
  current_song: unknown;
  queue: unknown;
  is_playing: boolean;
  position_seconds: number | string;
  state_updated_at: string;
  status: string;
  created_at: string;
}

const toSongSnapshot = (v: unknown): SongSnapshot | null => {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.audio_url !== 'string') return null;
  return {
    id: o.id,
    title: typeof o.title === 'string' ? o.title : 'Unknown',
    artist: typeof o.artist === 'string' ? o.artist : 'Unknown',
    audio_url: o.audio_url,
    cover_url: typeof o.cover_url === 'string' ? o.cover_url : null,
    duration: typeof o.duration === 'string' ? o.duration : null,
  };
};

const transformSession = (raw: RawSession): ListenSessionState => ({
  id: raw.id,
  code: raw.code,
  name: raw.name,
  host_id: raw.host_id,
  host_name: raw.host_name,
  current_song: toSongSnapshot(raw.current_song),
  queue: Array.isArray(raw.queue) ? raw.queue.map(toSongSnapshot).filter(Boolean) as SongSnapshot[] : [],
  is_playing: raw.is_playing,
  position_seconds: Number(raw.position_seconds) || 0,
  state_updated_at: raw.state_updated_at,
  status: raw.status,
  created_at: raw.created_at,
});

/** Create a new listen session and register the creator as host. */
export const createListenSession = async (user: { id: string }, name: string): Promise<ListenSessionState | null> => {
  const hostName = userDisplayName(user);
  const { data, error } = await supabase
    .from('listen_sessions')
    .insert({ name: name || `${hostName}'s Session`, host_id: user.id, host_name: hostName, is_playing: false })
    .select('*')
    .single();
  if (error || !data) return null;
  await joinListenSession(data.id, user);
  return transformSession(data as RawSession);
};

export const userDisplayName = (user: { id: string; user_metadata?: Record<string, unknown>; email?: string }): string => {
  const meta = user.user_metadata || {};
  const fullName = typeof meta.full_name === 'string' ? meta.full_name : '';
  const avatar = typeof meta.avatar_url === 'string' ? meta.avatar_url : null;
  void avatar;
  return fullName || user.email?.split('@')[0] || 'User';
};

export const userAvatarUrl = (user: { user_metadata?: Record<string, unknown> }): string | null => {
  const meta = user.user_metadata || {};
  return typeof meta.avatar_url === 'string' ? meta.avatar_url : null;
};

/** Join an existing session (idempotent). Returns the session if joinable. */
export const joinListenSession = async (sessionId: string, user: { id: string; user_metadata?: Record<string, unknown>; email?: string }): Promise<ListenSessionState | null> => {
  const { data: raw } = await supabase
    .from('listen_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();
  if (!raw || raw.status !== 'active') return null;
  await supabase.from('listen_session_participants').upsert(
    {
      session_id: sessionId,
      user_id: user.id,
      user_name: userDisplayName(user),
      avatar_url: userAvatarUrl(user),
      is_host: raw.host_id === user.id,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'session_id,user_id' }
  );
  return transformSession(raw as RawSession);
};

export const findSessionByCode = async (code: string): Promise<ListenSessionState | null> => {
  const { data: raw } = await supabase
    .from('listen_sessions')
    .select('*')
    .eq('code', code.trim())
    .eq('status', 'active')
    .maybeSingle();
  return raw ? transformSession(raw as RawSession) : null;
};

export interface LobbySession {
  session: ListenSessionState;
  participant_count: number;
}

export const fetchActiveSessions = async (): Promise<LobbySession[]> => {
  const since = new Date(Date.now() - STALE_SESSION_MS).toISOString();
  const { data: sessions } = await supabase
    .from('listen_sessions')
    .select('*')
    .eq('status', 'active')
    .gt('updated_at', since)
    .order('created_at', { ascending: false })
    .limit(30);
  if (!sessions || sessions.length === 0) return [];
  const ids = sessions.map(s => s.id);
  const { data: parts } = await supabase
    .from('listen_session_participants')
    .select('session_id, last_seen_at')
    .in('session_id', ids);
  const counts = new Map<string, number>();
  (parts || []).forEach(p => {
    // only count members seen in the last 2 minutes
    if (new Date(p.last_seen_at).getTime() > Date.now() - 120000) {
      counts.set(p.session_id, (counts.get(p.session_id) || 0) + 1);
    }
  });
  return sessions.map(s => ({ session: transformSession(s as RawSession), participant_count: counts.get(s.id) || 0 }));
};

// ================= Hook =================

export function useListenSession(sessionId: string | null) {
  const { user } = useAuth();
  const { playSong, seekTo, pausePlayback, resumePlayback, audioRef } = useAudio();

  const [session, setSession] = useState<ListenSessionState | null>(null);
  const [participants, setParticipants] = useState<ListenParticipant[]>([]);
  const [messages, setMessages] = useState<ListenMessage[]>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(!!sessionId);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const sessionRef = useRef<ListenSessionState | null>(null);
  sessionRef.current = session;
  const appliedRef = useRef<{ songId: string | null; playing: boolean }>({ songId: null, playing: false });
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionIdRef = useRef(0);
  const historyRef = useRef<SongSnapshot[]>([]);

  const isHost = !!user && !!session && session.host_id === user.id && session.status === 'active';

  // ---------- data loads ----------
  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    const { data: raw, error: err } = await supabase
      .from('listen_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    if (err) { setError('Could not load this session.'); setLoading(false); return; }
    if (!raw) { setError('This session no longer exists.'); setLoading(false); return; }
    setSession(transformSession(raw as RawSession));
    setLoading(false);
  }, [sessionId]);

  const fetchParticipants = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await supabase
      .from('listen_session_participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });
    setParticipants((data || []) as ListenParticipant[]);
  }, [sessionId]);

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await supabase
      .from('listen_session_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(60);
    setMessages(((data || []) as ListenMessage[]).reverse());
  }, [sessionId]);

  // ---------- realtime subscription ----------
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    (async () => {
      await fetchSession();
      await Promise.all([fetchParticipants(), fetchMessages()]);
    })();

    const channel = supabase.channel(`listen:${sessionId}`, {
      config: { presence: { key: user?.id || Math.random().toString(36).slice(2) } },
    });

    channel
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'listen_sessions', filter: `id=eq.${sessionId}` },
        (payload) => setSession(transformSession(payload.new as RawSession)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listen_session_participants', filter: `session_id=eq.${sessionId}` },
        (payload) => setParticipants(prev => {
          const row = payload.new as ListenParticipant;
          const exists = prev.some(p => p.user_id === row.user_id);
          return exists ? prev.map(p => (p.user_id === row.user_id ? row : p)) : [...prev, row];
        }))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'listen_session_participants', filter: `session_id=eq.${sessionId}` },
        (payload) => setParticipants(prev => prev.filter(p => p.id !== (payload.old as { id: string }).id)))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'listen_session_participants', filter: `session_id=eq.${sessionId}` },
        (payload) => setParticipants(prev => prev.map(p => (p.id === (payload.new as ListenParticipant).id ? payload.new as ListenParticipant : p))))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listen_session_messages', filter: `session_id=eq.${sessionId}` },
        (payload) => setMessages(prev => [...prev, payload.new as ListenMessage]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'listen_session_messages', filter: `session_id=eq.${sessionId}` },
        (payload) => setMessages(prev => prev.filter(m => m.id !== (payload.old as { id: string }).id)))
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        const { emoji, user_name, user_id } = payload as { emoji: string; user_name: string; user_id: string };
        const id = ++reactionIdRef.current;
        setReactions(prev => [...prev.slice(-30), { id, emoji, user_name, mine: user_id === user?.id }]);
        setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 4000);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineIds(new Set(Object.keys(state)));
      });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' && user && !cancelled) {
        channel.track({ user_id: user.id, name: userDisplayName(user), avatar: userAvatarUrl(user) });
      }
    });
    channelRef.current = channel;

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId, fetchSession, fetchParticipants, fetchMessages, user]);

  // ---------- heartbeat ----------
  useEffect(() => {
    if (!sessionId || !user) return;
    const beat = () => {
      supabase
        .from('listen_session_participants')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .then(() => {});
    };
    beat();
    const iv = setInterval(beat, HEARTBEAT_MS);
    return () => clearInterval(iv);
  }, [sessionId, user]);

  // ---------- guest sync: follow the host ----------
  useEffect(() => {
    if (!session || isHost || session.status !== 'active') return;
    const song = session.current_song;
    if (!song) return;
    const audio = audioRef.current;
    const expected = expectedPosition(session);
    const prev = appliedRef.current;

    if (prev.songId !== song.id) {
      appliedRef.current = { songId: song.id, playing: session.is_playing };
      playSong(toSong(song), undefined, expected);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      if (!session.is_playing) {
        pauseTimerRef.current = setTimeout(() => pausePlayback(), 800);
      }
    } else if (prev.playing !== session.is_playing) {
      appliedRef.current = { songId: song.id, playing: session.is_playing };
      if (session.is_playing) resumePlayback();
      else pausePlayback();
    } else if (audio && audio.readyState >= 1 && session.is_playing) {
      const drift = audio.currentTime - expected;
      if (Math.abs(drift) > DRIFT_TOLERANCE_S) seekTo(expected);
    }
  }, [session, isHost, playSong, seekTo, pausePlayback, resumePlayback, audioRef]);

  // ---------- guest drift correction loop ----------
  useEffect(() => {
    if (!sessionId || isHost) return;
    const iv = setInterval(() => {
      const s = sessionRef.current;
      const audio = audioRef.current;
      if (!s || !s.current_song || !audio || audio.readyState < 1) return;
      if (!s.is_playing || s.status !== 'active') return;
      const expected = expectedPosition(s);
      const dur = audio.duration;
      if (dur && Number.isFinite(dur) && expected > dur - 0.4) return; // song tail; host will push the next one
      if (Math.abs(audio.currentTime - expected) > DRIFT_TOLERANCE_S) seekTo(expected);
    }, DRIFT_CHECK_MS);
    return () => clearInterval(iv);
  }, [sessionId, isHost, seekTo, audioRef]);

  // ---------- host: broadcast position ----------
  useEffect(() => {
    if (!sessionId || !isHost) return;
    const iv = setInterval(async () => {
      const s = sessionRef.current;
      const audio = audioRef.current;
      if (!s?.current_song) return;
      const playing = !!audio && !audio.paused;
      await supabase
        .from('listen_sessions')
        .update({
          is_playing: playing,
          position_seconds: audio ? audio.currentTime : 0,
          state_updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }, HOST_POSITION_SYNC_MS);
    return () => clearInterval(iv);
  }, [sessionId, isHost, audioRef]);

  // ---------- host actions ----------
  const pushState = useCallback(async (patch: {
    current_song?: SongSnapshot | null;
    queue?: SongSnapshot[];
    is_playing?: boolean;
    position_seconds?: number;
  }) => {
    if (!sessionId) return;
    const { error: err } = await supabase
      .from('listen_sessions')
      .update({ ...patch, state_updated_at: new Date().toISOString() } as any)
      .eq('id', sessionId);
    if (err) console.error('Failed to push playback state:', err);
  }, [sessionId]);

  const playSongNow = useCallback((snap: SongSnapshot) => {
    const s = sessionRef.current;
    if (s?.current_song) historyRef.current = [...historyRef.current.slice(-9), s.current_song];
    const remaining = (s?.queue || []).filter(q => q.id !== snap.id);
    playSong(toSong(snap), undefined, 0);
    appliedRef.current = { songId: snap.id, playing: true };
    pushState({ current_song: snap, queue: remaining, is_playing: true, position_seconds: 0 });
  }, [playSong, pushState]);

  const toggleHostPlayback = useCallback(() => {
    const s = sessionRef.current;
    const audio = audioRef.current;
    if (!s?.current_song) return;
    const pos = audio ? audio.currentTime : 0;
    if (s.is_playing) {
      pushState({ is_playing: false, position_seconds: pos });
      pausePlayback();
    } else {
      pushState({ is_playing: true, position_seconds: pos });
      resumePlayback();
    }
  }, [pushState, pausePlayback, resumePlayback, audioRef]);

  const seekHost = useCallback((time: number) => {
    const s = sessionRef.current;
    if (!s) return;
    pushState({ position_seconds: Math.max(0, time), is_playing: s.is_playing });
    seekTo(Math.max(0, time));
  }, [pushState, seekTo]);

  const nextSong = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    const next = s.queue[0];
    if (!next) return;
    if (s.current_song) historyRef.current = [...historyRef.current.slice(-9), s.current_song];
    playSongNow(next);
  }, [playSongNow]);

  const previousSong = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    const prev = historyRef.current.pop();
    if (!prev) return;
    playSongNow(prev);
  }, [playSongNow]);

  const addToQueue = useCallback((snap: SongSnapshot) => {
    const s = sessionRef.current;
    if (!s) return;
    pushState({ queue: [...s.queue, snap] });
  }, [pushState]);

  const removeFromQueue = useCallback((index: number) => {
    const s = sessionRef.current;
    if (!s) return;
    pushState({ queue: s.queue.filter((_, i) => i !== index) });
  }, [pushState]);

  const playQueueItem = useCallback((index: number) => {
    const s = sessionRef.current;
    if (!s) return;
    playSongNow(s.queue[index]);
  }, [playSongNow]);

  const transferHost = useCallback(async (newHost: ListenParticipant) => {
    const s = sessionRef.current;
    if (!s) return;
    const { error: err } = await supabase
      .from('listen_sessions')
      .update({ host_id: newHost.user_id, host_name: newHost.user_name })
      .eq('id', s.id);
    if (err) { console.error('Transfer failed:', err); return; }
    await supabase.from('listen_session_participants').update({ is_host: false }).eq('session_id', s.id).eq('user_id', user!.id);
    await supabase.from('listen_session_participants').update({ is_host: true }).eq('session_id', s.id).eq('user_id', newHost.user_id);
  }, [user]);

  const removeParticipant = useCallback(async (p: ListenParticipant) => {
    await supabase.from('listen_session_participants').delete().eq('id', p.id);
  }, []);

  const endSession = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    await supabase
      .from('listen_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString(), is_playing: false })
      .eq('id', s.id);
    pausePlayback();
  }, [pausePlayback]);

  const leaveSession = useCallback(async () => {
    if (!sessionId || !user) return;
    await supabase
      .from('listen_session_participants')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', user.id);
  }, [sessionId, user]);

  // ---------- reactions ----------
  const sendReaction = useCallback((emoji: string) => {
    const channel = channelRef.current;
    if (!channel || !user) return;
    channel.send({
      type: 'broadcast',
      event: 'reaction',
      payload: { emoji, user_name: userDisplayName(user), user_id: user.id },
    });
  }, [user]);

  // ---------- chat ----------
  const sendMessage = useCallback(async (text: string) => {
    if (!sessionId || !user || !text.trim()) return;
    const { error: err } = await supabase.from('listen_session_messages').insert({
      session_id: sessionId,
      user_id: user.id,
      user_name: userDisplayName(user),
      avatar_url: userAvatarUrl(user),
      message: text.trim(),
    });
    if (err) console.error('Failed to send message:', err);
  }, [sessionId, user]);

  const sendVoice = useCallback(async (blob: Blob, duration: number) => {
    if (!sessionId || !user) return;
    const path = `${user.id}/listen-voice-${Date.now()}.webm`;
    const { error: upErr } = await supabase.storage.from('community-uploads').upload(path, blob);
    if (upErr) { console.error('Voice upload failed:', upErr); return; }
    const { data: urlData } = supabase.storage.from('community-uploads').getPublicUrl(path);
    const { error: err } = await supabase.from('listen_session_messages').insert({
      session_id: sessionId,
      user_id: user.id,
      user_name: userDisplayName(user),
      avatar_url: userAvatarUrl(user),
      voice_url: urlData.publicUrl,
      voice_duration: duration,
    });
    if (err) console.error('Failed to send voice note:', err);
  }, [sessionId, user]);

  const deleteMessage = useCallback(async (messageId: string) => {
    await supabase.from('listen_session_messages').delete().eq('id', messageId);
  }, []);

  return {
    session,
    participants,
    messages,
    onlineIds,
    reactions,
    loading,
    error,
    isHost,
    // host controls
    playSongNow,
    toggleHostPlayback,
    seekHost,
    nextSong,
    previousSong,
    addToQueue,
    removeFromQueue,
    playQueueItem,
    transferHost,
    removeParticipant,
    endSession,
    leaveSession,
    // social
    sendReaction,
    sendMessage,
    sendVoice,
    deleteMessage,
    refreshParticipants: fetchParticipants,
  };
}
