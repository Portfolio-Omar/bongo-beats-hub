import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import { 
  Download, Play, Pause, Search, Trash2, Music, Wifi, WifiOff, 
  HardDrive, Loader2, CheckCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface DownloadedSong {
  id: string;
  title: string;
  artist: string;
  cover_url: string | null;
  blob_url: string;
  size: number;
  downloaded_at: number;
}

interface AvailableSong {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
}

const DB_NAME = 'bongo_downloads';
const STORE_NAME = 'songs';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const Downloads: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [downloads, setDownloads] = useState<DownloadedSong[]>([]);
  const [availableSongs, setAvailableSongs] = useState<AvailableSong[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'downloaded' | 'browse'>('downloaded');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load downloaded songs from IndexedDB
  const loadDownloads = async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const songs = req.result as DownloadedSong[];
        songs.sort((a, b) => b.downloaded_at - a.downloaded_at);
        setDownloads(songs);
      };
    } catch {
      console.error('Failed to load downloads');
    }
  };

  // Load available songs
  useEffect(() => {
    loadDownloads();
    const fetchSongs = async () => {
      const { data } = await supabase
        .from('songs')
        .select('id, title, artist, audio_url, cover_url')
        .eq('published', true)
        .order('title');
      if (data) setAvailableSongs(data);
    };
    fetchSongs();
  }, []);

  const downloadSong = async (song: AvailableSong) => {
    setDownloading(prev => ({ ...prev, [song.id]: true }));
    try {
      const response = await fetch(song.audio_url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const downloadedSong: DownloadedSong = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        cover_url: song.cover_url,
        blob_url: '', // We'll store the actual blob
        size: blob.size,
        downloaded_at: Date.now(),
      };

      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      // Store with blob data
      store.put({ ...downloadedSong, audio_blob: blob, blob_url: blobUrl });
      
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      toast.success(`Downloaded "${song.title}"`);
      loadDownloads();
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download song');
    } finally {
      setDownloading(prev => ({ ...prev, [song.id]: false }));
    }
  };

  const deleteSong = async (id: string) => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      await new Promise<void>((r) => { tx.oncomplete = () => r(); });
      toast.success('Song removed from downloads');
      loadDownloads();
      if (playingId === id) {
        if (audioRef.current) audioRef.current.pause();
        setPlayingId(null);
      }
    } catch {
      toast.error('Failed to remove song');
    }
  };

  const playOffline = async (id: string) => {
    if (playingId === id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const data = req.result;
        if (data?.audio_blob) {
          const url = URL.createObjectURL(data.audio_blob);
          if (audioRef.current) audioRef.current.pause();
          const audio = new Audio(url);
          audio.play();
          audio.onended = () => setPlayingId(null);
          audioRef.current = audio;
          setPlayingId(id);
        }
      };
    } catch {
      toast.error('Failed to play song');
    }
  };

  const isDownloaded = (id: string) => downloads.some(d => d.id === id);

  const filteredAvailable = availableSongs.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDownloads = downloads.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = downloads.reduce((s, d) => s + d.size, 0);

  if (!isAuthenticated) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
        <p className="text-muted-foreground mb-4">Sign in to download songs for offline listening.</p>
        <Button onClick={() => navigate('/auth')}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 sm:py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Download className="h-6 w-6 text-primary" />
            Downloads
          </h1>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
            <WifiOff className="h-4 w-4" /> Listen offline without internet
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <HardDrive className="h-3 w-3" />
          {downloads.length} songs • {(totalSize / (1024 * 1024)).toFixed(1)}MB
        </Badge>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <Button variant={tab === 'downloaded' ? 'default' : 'outline'} onClick={() => setTab('downloaded')} className="gap-2">
          <WifiOff className="h-4 w-4" /> My Downloads ({downloads.length})
        </Button>
        <Button variant={tab === 'browse' ? 'default' : 'outline'} onClick={() => setTab('browse')} className="gap-2">
          <Wifi className="h-4 w-4" /> Browse & Download
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search songs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      {tab === 'downloaded' ? (
        <div className="space-y-2">
          {filteredDownloads.length === 0 ? (
            <div className="text-center py-16">
              <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No downloaded songs</h3>
              <p className="text-muted-foreground mb-4">Download songs to listen offline</p>
              <Button onClick={() => setTab('browse')}>Browse Songs</Button>
            </div>
          ) : (
            filteredDownloads.map(song => (
              <Card key={song.id} className="border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {song.cover_url ? (
                      <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{song.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                    <p className="text-xs text-muted-foreground">{(song.size / (1024 * 1024)).toFixed(1)}MB</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => playOffline(song.id)}>
                      {playingId === song.id ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => deleteSong(song.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <ScrollArea className="h-[60vh]">
          <div className="space-y-2">
            {filteredAvailable.map(song => (
              <Card key={song.id} className="border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {song.cover_url ? (
                      <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{song.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                  </div>
                  {isDownloaded(song.id) ? (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <CheckCircle className="h-3 w-3" /> Saved
                    </Badge>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1"
                      disabled={downloading[song.id]}
                      onClick={() => downloadSong(song)}>
                      {downloading[song.id] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      {downloading[song.id] ? 'Saving...' : 'Save'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default Downloads;
