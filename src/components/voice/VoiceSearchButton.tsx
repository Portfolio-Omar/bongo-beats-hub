import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceSearchButtonProps {
  onResult: (text: string) => void;
  className?: string;
}

const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({ onResult, className }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
      setIsListening(false);
      toast.success(`Searching for "${text}"`);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Could not understand. Please try again.');
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <Button
      variant={isListening ? 'default' : 'outline'}
      size="icon"
      onClick={isListening ? stopListening : startListening}
      className={`${isListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'border-gold/30 hover:bg-gold/10'} ${className}`}
      title={isListening ? 'Stop listening' : 'Voice search'}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
};

export default VoiceSearchButton;
