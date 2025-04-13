
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Music, Headphones, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const backgroundImages = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80',
  'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80',
];

const Hero: React.FC = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Change image every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden pt-20 md:pt-28 pb-16">
      {/* Image Slideshow Background */}
      {backgroundImages.map((image, index) => (
        <div
          key={index}
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-2000 z-0"
          style={{
            backgroundImage: `url(${image})`,
            opacity: index === currentImageIndex ? 1 : 0,
          }}
        />
      ))}
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50 z-0" />
      
      {/* Moving Bubbles */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        {[...Array(15)].map((_, i) => {
          const size = Math.random() * 100 + 50;
          const initialX = Math.random() * 100;
          const initialY = Math.random() * 100;
          const duration = Math.random() * 15 + 10;
          const delay = Math.random() * 5;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10 backdrop-blur-sm"
              style={{ width: size, height: size }}
              initial={{ x: `${initialX}vw`, y: `${initialY}vh`, opacity: 0.1 }}
              animate={{
                x: `${initialX + (Math.random() * 20 - 10)}vw`,
                y: `${initialY + (Math.random() * 20 - 10)}vh`,
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: duration,
                repeat: Infinity,
                repeatType: "reverse",
                delay: delay,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </div>
      
      {/* Content */}
      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block rounded-full bg-accent/80 px-3 py-1 text-xs font-medium text-primary">
              Preserving Cultural Heritage
            </span>
          </motion.div>
          
          <motion.h1 
            className="mt-6 max-w-4xl font-display text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Experience the Timeless Rhythm of{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Bongo & Kenyan</span> Music
          </motion.h1>
          
          <motion.p 
            className="mt-6 max-w-2xl text-lg text-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Immerse yourself in a curated collection of classic East African melodies, 
            preserving the rich musical heritage for generations to come.
          </motion.p>
          
          <motion.div 
            className="mt-10 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button asChild size="lg" className="gap-2 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Link to="/music">
                <Headphones className="h-5 w-5" />
                Listen Now
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 px-6 border-primary/20 hover:bg-primary/5 text-white border-white/30">
              <Link to="/blog">
                <MessageSquare className="h-5 w-5" />
                Read Our Blog
              </Link>
            </Button>
          </motion.div>
        </div>
        
        {/* Featured Music Preview with enhanced glassmorphism */}
        <motion.div 
          className="mt-20 mx-auto max-w-3xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="backdrop-blur-lg bg-white/10 border border-white/10 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-lg">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-white/20">
              <img 
                src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" 
                alt="Featured Track" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-grow text-center sm:text-left">
              <h3 className="text-xl font-semibold text-white">Experience Classic Bongo</h3>
              <p className="text-sm text-gray-200">
                Explore our handpicked collection of timeless tracks from East Africa's musical legends.
              </p>
            </div>
            <Button asChild variant="secondary" className="flex-shrink-0 bg-white/20 hover:bg-white/30">
              <Link to="/music">
                <Music className="mr-2 h-4 w-4" />
                Explore
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
