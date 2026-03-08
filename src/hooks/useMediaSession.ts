import { useEffect } from 'react';
import { useAudio } from '@/context/AudioContext';

export function useMediaSession() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
  } = useAudio();

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.genre || 'Bongo Old Skool',
      artwork: currentSong.cover_url
        ? [
            { src: currentSong.cover_url, sizes: '96x96', type: 'image/jpeg' },
            { src: currentSong.cover_url, sizes: '128x128', type: 'image/jpeg' },
            { src: currentSong.cover_url, sizes: '192x192', type: 'image/jpeg' },
            { src: currentSong.cover_url, sizes: '256x256', type: 'image/jpeg' },
            { src: currentSong.cover_url, sizes: '384x384', type: 'image/jpeg' },
            { src: currentSong.cover_url, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [],
    });
  }, [currentSong]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1,
        position: Math.min(currentTime, duration),
      });
    } catch {
      // Some browsers don't support setPositionState
    }
  }, [currentTime, duration]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => togglePlayPause()],
      ['pause', () => togglePlayPause()],
      ['previoustrack', () => playPrevious()],
      ['nexttrack', () => playNext()],
      ['seekto', (details) => {
        if (details.seekTime !== undefined) seekTo(details.seekTime);
      }],
    ];

    handlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Action not supported
      }
    });

    return () => {
      handlers.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore
        }
      });
    };
  }, [togglePlayPause, playNext, playPrevious, seekTo]);
}
