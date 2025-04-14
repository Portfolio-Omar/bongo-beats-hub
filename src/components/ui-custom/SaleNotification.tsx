
import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShoppingBag, X, InfoIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface SaleNotificationProps {
  delay?: number; // Delay in milliseconds before showing notification
}

const SaleNotification: React.FC<SaleNotificationProps> = ({ delay = 3000 }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const { toast } = useToast();
  
  // Show dialog after delay
  useEffect(() => {
    const hasSeenNotification = localStorage.getItem('hasSeenSaleNotification');
    
    if (!hasSeenNotification) {
      const timer = setTimeout(() => {
        setShowDialog(true);
      }, delay);
      
      return () => clearTimeout(timer);
    } else {
      // Show banner anyway if they've seen the dialog before
      setShowBanner(true);
    }
  }, [delay]);

  const handleDialogClose = () => {
    setShowDialog(false);
    setShowBanner(true);
    localStorage.setItem('hasSeenSaleNotification', 'true');
  };
  
  const handleContactClick = () => {
    toast({
      title: "Contact Information",
      description: "You can reach us through our contact page. We'll get back to you shortly!",
      duration: 5000,
    });
  };
  
  return (
    <>
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Website For Sale
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              <p className="mb-2">
                This website including its complete source code, design, and content is currently available for purchase.
              </p>
              <p className="font-medium text-foreground">
                Unique opportunity to acquire a fully functional music platform with modern design and complete backend infrastructure.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDialogClose}>Close</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link to="/contact">
                <Button className="bg-primary" onClick={handleContactClick}>Contact Us</Button>
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AnimatePresence>
        {showBanner && (
          <motion.div
            className="sticky top-0 z-50 w-full"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="w-full rounded-none border-primary/20 bg-primary/5 shadow-sm">
              <InfoIcon className="h-4 w-4 text-primary" />
              <div className="flex items-center justify-between w-full">
                <div>
                  <AlertTitle className="text-primary">Website For Sale</AlertTitle>
                  <AlertDescription>
                    This website is available for purchase. Contact us for details.
                  </AlertDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/contact">
                    <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10" onClick={handleContactClick}>
                      Contact Us
                    </Button>
                  </Link>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowBanner(false)}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SaleNotification;
