import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import professorJay from '@/assets/artist-professor-jay.jpg';
import diamondPlatnumz from '@/assets/artist-diamond-platnumz.jpg';
import alikiba from '@/assets/artist-alikiba.jpg';

const backgroundImages = [
  professorJay,
  diamondPlatnumz,
  alikiba,
];

const BackgroundSlideshow = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImages[currentIndex]})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background/95" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BackgroundSlideshow;
