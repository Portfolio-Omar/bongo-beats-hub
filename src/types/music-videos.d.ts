
// This file contains type definitions for the music videos feature

export interface MusicVideo {
  id: string;
  title: string;
  artist: string;
  video_url: string;
  thumbnail_url: string | null;
  view_count: number;
  published: boolean;
  created_at: string;
}

export interface MusicVideoUpload {
  title: string;
  artist: string;
  video: File | null;
  thumbnail: File | null;
}
