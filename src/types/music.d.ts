
export interface Song {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
  genre: string | null;
  year: string | null;
  duration: string | null;
  published: boolean;
  created_at: string;
  download_count?: number;
}

export interface SongOfTheWeek {
  id: string;
  song_id: string;
  feature_date: string;
  active: boolean;
  song: Song;
}
