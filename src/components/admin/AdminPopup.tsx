
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Shield, Music, BookOpen, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';

interface AdminPopupProps {
  delay?: number; // Time in milliseconds before popup appears
}

const AdminPopup: React.FC<AdminPopupProps> = ({ delay = 20000 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Only show popup if user is authenticated
    if (!isAuthenticated) return;
    
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <>
      <Button 
        variant="outline" 
        className="fixed bottom-4 right-4 z-50 shadow-md bg-background flex items-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Shield className="h-4 w-4" />
        <span>Admin Panel</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Quick Access
            </DialogTitle>
            <DialogDescription>
              Manage your website content and monitor activity
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <Link to="/admin" className="col-span-2">
              <Button variant="default" className="w-full flex items-center gap-2 h-auto py-6">
                <Shield className="h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Admin Dashboard</span>
                  <span className="text-xs text-muted-foreground">Full admin control panel</span>
                </div>
              </Button>
            </Link>
            
            <Link to="/admin?tab=music">
              <Button variant="outline" className="w-full flex items-center gap-2 h-auto py-4">
                <Music className="h-5 w-5 text-primary" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Music</span>
                  <span className="text-xs text-muted-foreground">Manage tracks</span>
                </div>
              </Button>
            </Link>
            
            <Link to="/admin?tab=blog">
              <Button variant="outline" className="w-full flex items-center gap-2 h-auto py-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Blog</span>
                  <span className="text-xs text-muted-foreground">Edit articles</span>
                </div>
              </Button>
            </Link>
            
            <Link to="/admin?tab=feedback" className="col-span-2">
              <Button variant="outline" className="w-full flex items-center gap-2 h-auto py-4">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Feedback</span>
                  <span className="text-xs text-muted-foreground">View user feedback</span>
                </div>
              </Button>
            </Link>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            <Button variant="default" asChild>
              <Link to="/admin">Open Full Dashboard</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminPopup;
