
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import MusicPlayer from '@/components/ui-custom/MusicPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Music2, PlayCircle, Clock,
  ChevronDown, Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from 'framer-motion';

// Mock data for songs
const songs = [
  {
    id: '1',
    title: 'Malaika',
    artist: 'Fadhili William',
    genre: 'Classic',
    duration: '4:32',
    year: '1960',
    coverUrl: 'https://images.unsplash.com/photo-1598387833924-90299d6a5d8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
    audioUrl: 'https://cdn.freesound.org/previews/617/617306_5674468-lq.mp3',
  },
  {
    id: '2',
    title: 'Jambo Bwana',
    artist: 'Them Mushrooms',
    genre: 'Benga',
    duration: '3:45',
    year: '1982',
    coverUrl: 'https://images.unsplash.com/photo-1481886756534-97af88ccb438?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
    audioUrl: 'https://cdn.freesound.org/previews/612/612092_5674468-lq.mp3',
  },
  {
    id: '3',
    title: 'Dunia Ina Mambo',
    artist: 'Remmy Ongala',
    genre: 'Soukous',
    duration: '5:18',
    year: '1988',
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
    audioUrl: 'https://cdn.freesound.org/previews/617/617655_11861866-lq.mp3',
  },
  {
    id: '4',
    title: 'Shauri Yako',
    artist: 'Nguashi Ntimbo',
    genre: 'Rhumba',
    duration: '6:02',
    year: '1975',
    coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
    audioUrl: 'https://cdn.freesound.org/previews/612/612095_5674468-lq.mp3',
  },
  {
    id: '5',
    title: 'Sina Makosa',
    artist: 'Les Wanyika',
    genre: 'Benga',
    duration: '4:15',
    year: '1979',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80',
    audioUrl: 'https://cdn.freesound.org/previews/612/612093_5674468-lq.mp3',
  },
];

const Music: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(songs[0]);
  const [sortBy, setSortBy] = useState('title');
  const [filterGenre, setFilterGenre] = useState('all');
  
  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = filterGenre === 'all' || song.genre === filterGenre;
    return matchesSearch && matchesGenre;
  });
  
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
    if (sortBy === 'year') return a.year.localeCompare(b.year);
    return 0;
  });
  
  const genres = ['all', ...new Set(songs.map(song => song.genre))];
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <motion.h1 
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Music Library
          </motion.h1>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Explore our curated collection of classic Bongo and Kenyan tracks, 
            preserving the rich musical heritage of East Africa.
          </motion.p>
        </div>
        
        {/* Music Player */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <MusicPlayer song={selectedSong} />
        </motion.div>
        
        {/* Search and Filters */}
        <motion.div 
          className="mb-8 flex flex-col md:flex-row gap-4 justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter by genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>
                      {genre === 'all' ? 'All Genres' : genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="artist">Artist</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
        
        {/* Song List */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="hidden md:grid grid-cols-12 py-3 px-4 text-sm font-medium text-muted-foreground bg-secondary rounded-lg">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Title</div>
            <div className="col-span-3">Artist</div>
            <div className="col-span-2">Genre</div>
            <div className="col-span-1 text-right">Duration</div>
          </div>
          
          {sortedSongs.length > 0 ? (
            sortedSongs.map((song, index) => (
              <motion.div 
                key={song.id}
                className={`grid grid-cols-1 md:grid-cols-12 items-center py-3 px-4 rounded-lg transition-all duration-200 hover:bg-secondary/50 cursor-pointer ${selectedSong.id === song.id ? 'bg-secondary' : ''}`}
                onClick={() => setSelectedSong(song)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <div className="hidden md:block col-span-1 text-muted-foreground">{index + 1}</div>
                
                <div className="flex items-center gap-3 col-span-1 md:col-span-5">
                  <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                    <img 
                      src={song.coverUrl} 
                      alt={song.title} 
                      className="h-full w-full object-cover"
                    />
                    {selectedSong.id === song.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <PlayCircle className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium line-clamp-1">{song.title}</h3>
                    <p className="text-sm text-muted-foreground md:hidden">{song.artist}</p>
                  </div>
                </div>
                
                <div className="hidden md:block col-span-3 text-muted-foreground">{song.artist}</div>
                <div className="hidden md:block col-span-2 text-muted-foreground">{song.genre}</div>
                
                <div className="hidden md:flex col-span-1 justify-end items-center text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{song.duration}</span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <Music2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No songs found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Music;
