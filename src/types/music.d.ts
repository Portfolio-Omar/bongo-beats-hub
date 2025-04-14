
export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  year: string;
  duration: string;
  audio_url: string;
  cover_url: string;
  created_at: string;
  published: boolean;
  download_count: number;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  image_url?: string;
  created_at: string;
}
