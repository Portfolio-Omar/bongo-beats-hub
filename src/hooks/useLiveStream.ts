import { useCallback, useRef, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

interface PeerConnection {
  pc: RTCPeerConnection;
  peerId: string;
}

export function useBroadcaster(sessionId: string | null) {
  const [isLive, setIsLive] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const startMedia = useCallback(async (videoDeviceId?: string, audioDeviceId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId }, echoCancellation: true, noiseSuppression: true } : { echoCancellation: true, noiseSuppression: true },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (e) {
      console.error('Failed to get media:', e);
      return null;
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setScreenStream(screen);
      // Replace video track for all peers
      const videoTrack = screen.getVideoTracks()[0];
      peersRef.current.forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });
      screen.getVideoTracks()[0].onended = () => {
        // Revert to camera
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        if (camTrack) {
          peersRef.current.forEach((pc) => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(camTrack);
          });
        }
        setScreenStream(null);
      };
      return screen;
    } catch (e) {
      console.error('Screen share failed:', e);
      return null;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        peersRef.current.forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(camTrack);
        });
      }
    }
  }, [screenStream]);

  const createPeerForViewer = useCallback(async (viewerId: string, channel: ReturnType<typeof supabase.channel>) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peersRef.current.set(viewerId, pc);

    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        channel.send({ type: 'broadcast', event: 'ice-candidate', payload: { candidate: e.candidate, from: 'broadcaster', to: viewerId } });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        pc.close();
        peersRef.current.delete(viewerId);
        setViewerCount(peersRef.current.size);
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    channel.send({ type: 'broadcast', event: 'offer', payload: { sdp: offer, from: 'broadcaster', to: viewerId } });
    setViewerCount(peersRef.current.size);
  }, []);

  const goLive = useCallback(async () => {
    if (!sessionId) return;

    const channel = supabase.channel(`live-${sessionId}`);
    channelRef.current = channel;

    channel.on('broadcast', { event: 'viewer-join' }, async ({ payload }) => {
      await createPeerForViewer(payload.viewerId, channel);
    });

    channel.on('broadcast', { event: 'answer' }, async ({ payload }) => {
      const pc = peersRef.current.get(payload.from);
      if (pc && payload.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      }
    });

    channel.on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
      if (payload.to !== 'broadcaster') return;
      const pc = peersRef.current.get(payload.from);
      if (pc && payload.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    });

    channel.on('broadcast', { event: 'viewer-leave' }, ({ payload }) => {
      const pc = peersRef.current.get(payload.viewerId);
      if (pc) { pc.close(); peersRef.current.delete(payload.viewerId); }
      setViewerCount(peersRef.current.size);
    });

    await channel.subscribe();

    await supabase.from('live_sessions').update({ status: 'live', started_at: new Date().toISOString() }).eq('id', sessionId);
    setIsLive(true);
  }, [sessionId, createPeerForViewer]);

  const stopLive = useCallback(async () => {
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    localStream?.getTracks().forEach(t => t.stop());
    screenStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setScreenStream(null);
    setIsLive(false);
    setViewerCount(0);

    if (sessionId) {
      await supabase.from('live_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', sessionId);
    }
  }, [sessionId, localStream, screenStream]);

  useEffect(() => {
    return () => {
      peersRef.current.forEach(pc => pc.close());
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { isLive, localStream, screenStream, viewerCount, startMedia, startScreenShare, stopScreenShare, goLive, stopLive };
}

export function useViewer(sessionId: string | null) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const viewerIdRef = useRef(crypto.randomUUID());

  const connect = useCallback(async () => {
    if (!sessionId) return;

    const viewerId = viewerIdRef.current;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    const stream = new MediaStream();
    setRemoteStream(stream);

    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach(track => {
        stream.addTrack(track);
      });
      setRemoteStream(new MediaStream(stream.getTracks()));
    };

    const channel = supabase.channel(`live-${sessionId}`);
    channelRef.current = channel;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        channel.send({ type: 'broadcast', event: 'ice-candidate', payload: { candidate: e.candidate, from: viewerId, to: 'broadcaster' } });
      }
    };

    pc.onconnectionstatechange = () => {
      setConnected(pc.connectionState === 'connected');
    };

    channel.on('broadcast', { event: 'offer' }, async ({ payload }) => {
      if (payload.to !== viewerId) return;
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channel.send({ type: 'broadcast', event: 'answer', payload: { sdp: answer, from: viewerId, to: 'broadcaster' } });
    });

    channel.on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
      if (payload.to !== viewerId) return;
      if (payload.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    });

    await channel.subscribe();
    channel.send({ type: 'broadcast', event: 'viewer-join', payload: { viewerId } });
  }, [sessionId]);

  const disconnect = useCallback(() => {
    if (channelRef.current && sessionId) {
      channelRef.current.send({ type: 'broadcast', event: 'viewer-leave', payload: { viewerId: viewerIdRef.current } });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    pcRef.current?.close();
    pcRef.current = null;
    setRemoteStream(null);
    setConnected(false);
  }, [sessionId]);

  useEffect(() => {
    return () => {
      pcRef.current?.close();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  return { remoteStream, connected, connect, disconnect };
}
