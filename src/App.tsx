import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AudioProvider } from "@/context/AudioContext";
import Layout from "@/components/layout/Layout";
import EnhancedAudioPlayer from "@/components/ui-custom/EnhancedAudioPlayer";
import AIChatbot from "@/components/chat/AIChatbot";

import Index from "./pages/Index";
import Music from "./pages/Music";
import Player from "./pages/Player";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Feedback from "./pages/Feedback";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import MobileMenu from "./pages/MobileMenu";
import Blog from "./pages/Blog";
import Favorites from "./pages/Favorites";
import Playlists from "./pages/Playlists";
import Monetization from "./pages/Monetization";
import ListeningRewardTracker from "./components/monetization/ListeningRewardTracker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AudioProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/player" element={<Player />} />
              <Route path="*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/music" element={<Music />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/feedback" element={<Feedback />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/playlists" element={<Playlists />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/menu" element={<MobileMenu />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/monetization" element={<Monetization />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
            <EnhancedAudioPlayer />
            <AIChatbot />
          </BrowserRouter>
        </AudioProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

