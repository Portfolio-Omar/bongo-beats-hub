
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from '@/context/ThemeContext'
import { AudioProvider } from '@/context/AudioContext'

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AudioProvider>
      <App />
    </AudioProvider>
  </ThemeProvider>
);
