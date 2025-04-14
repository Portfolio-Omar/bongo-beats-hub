
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Music from '@/pages/Music';
import Admin from '@/pages/Admin';
import Blog from '@/pages/Blog';
import Feedback from '@/pages/Feedback';
import Contact from '@/pages/Contact';
import VideoMusic from '@/pages/VideoMusic';
import Polls from '@/pages/Polls';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import MobileMenu from '@/pages/MobileMenu';
import SaleNotification from '@/components/ui-custom/SaleNotification';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <>
      <SaleNotification />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/music" element={<Music />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/video-music" element={<VideoMusic />} />
        <Route path="/polls" element={<Polls />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/mobile-menu" element={<MobileMenu />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
