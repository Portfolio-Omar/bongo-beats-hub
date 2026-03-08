import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeedbackTab from '@/components/admin/FeedbackTab';
import ModernBlogTab from '@/components/admin/ModernBlogTab';
import BatchUploadSongs from '@/components/admin/BatchUploadSongs';
import SongsManagementTab from '@/components/admin/SongsManagementTab';
import RequestedSongsTab from '@/components/admin/RequestedSongsTab';
import StatisticsDashboard from '@/components/admin/StatisticsDashboard';
import MonetizationTab from '@/components/admin/MonetizationTab';
import PromotionsTab from '@/components/admin/PromotionsTab';
import SecurityTab from '@/components/admin/SecurityTab';
import PaymentVerificationTab from '@/components/admin/PaymentVerificationTab';
import ShortsManagementTab from '@/components/admin/ShortsManagementTab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Music, FileText, MessageSquare, 
  Upload, Lock, BarChart3, Wallet, Megaphone, Shield, Timer, Video
} from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_PASSWORD = 'Calcium@123';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const REMEMBER_KEY = 'admin_device_token';
const REMEMBER_DURATION_MS = 24 * 60 * 60 * 1000;

const generateToken = (): string => {
  const payload = {
    ts: Date.now(),
    exp: Date.now() + REMEMBER_DURATION_MS,
    sig: btoa(`admin-${Date.now()}-${Math.random().toString(36).slice(2)}`),
  };
  return btoa(JSON.stringify(payload));
};

const validateToken = (): boolean => {
  try {
    const token = localStorage.getItem(REMEMBER_KEY);
    if (!token) return false;
    const payload = JSON.parse(atob(token));
    if (payload.exp && payload.exp > Date.now()) return true;
    localStorage.removeItem(REMEMBER_KEY);
    return false;
  } catch {
    localStorage.removeItem(REMEMBER_KEY);
    return false;
  }
};

class TabErrorBoundary extends React.Component<
  { children: React.ReactNode; name: string },
  { hasError: boolean; error?: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <p className="text-destructive font-medium">Error loading {this.props.name}</p>
          <p className="text-sm text-muted-foreground mt-2">{this.state.error}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const Admin: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(() => validateToken());
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [remainingTime, setRemainingTime] = useState(SESSION_TIMEOUT_MS);
  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!isUnlocked) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetActivity));

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = SESSION_TIMEOUT_MS - elapsed;
      setRemainingTime(Math.max(0, remaining));

      if (remaining <= 0) {
        setIsUnlocked(false);
        setPassword('');
        toast.info('Admin session expired due to inactivity');
      } else if (remaining <= 5 * 60 * 1000 && remaining > 4.95 * 60 * 1000) {
        toast.warning('Admin session expires in 5 minutes');
      }
    }, 1000);

    return () => {
      events.forEach(e => window.removeEventListener(e, resetActivity));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isUnlocked, resetActivity]);

  const handleUnlock = () => {
    if (password === ADMIN_PASSWORD) {
      setIsUnlocked(true);
      lastActivityRef.current = Date.now();
      setRemainingTime(SESSION_TIMEOUT_MS);
      if (rememberDevice) {
        localStorage.setItem(REMEMBER_KEY, generateToken());
      }
      toast.success('Admin access granted!');
    } else {
      toast.error('Incorrect password');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPassword('');
    localStorage.removeItem(REMEMBER_KEY);
  };

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isUnlocked) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto bg-card p-8 rounded-xl shadow-md border border-border/40">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-6 text-center">Admin Access</h2>
          <p className="text-center text-muted-foreground mb-4">Enter the admin password to continue</p>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberDevice}
                onCheckedChange={(checked) => setRememberDevice(checked === true)}
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                Remember this device for 24 hours
              </Label>
            </div>
            <Button className="w-full" onClick={handleUnlock}>Unlock</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-2 sm:px-4 py-6 sm:py-12">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">Session: </span><span>{formatTime(remainingTime)}</span>
            <Button variant="outline" size="sm" onClick={handleLock}>
              Lock
            </Button>
          </div>
        </div>
        
        <div className="p-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg">
          <Tabs defaultValue="songs" className="bg-background rounded-md">
            <div className="overflow-x-auto pb-2 pt-4 px-4">
              <TabsList className="h-12 bg-muted/80 backdrop-blur-sm flex-wrap">
                <TabsTrigger value="statistics" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <BarChart3 className="h-4 w-4" /><span>Statistics</span>
                </TabsTrigger>
                <TabsTrigger value="songs" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Music className="h-4 w-4" /><span>Songs</span>
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Upload className="h-4 w-4" /><span>Requested Songs</span>
                </TabsTrigger>
                <TabsTrigger value="blog" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <FileText className="h-4 w-4" /><span>Blog Posts</span>
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <MessageSquare className="h-4 w-4" /><span>Feedback</span>
                </TabsTrigger>
                <TabsTrigger value="uploads" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Upload className="h-4 w-4" /><span>Upload Songs</span>
                </TabsTrigger>
                <TabsTrigger value="monetization" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Wallet className="h-4 w-4" /><span>Monetization</span>
                </TabsTrigger>
                <TabsTrigger value="promotions" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Megaphone className="h-4 w-4" /><span>Promotions</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Wallet className="h-4 w-4" /><span>Payments</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Shield className="h-4 w-4" /><span>Security</span>
                </TabsTrigger>
                <TabsTrigger value="shorts" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Video className="h-4 w-4" /><span>Shorts</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-4">
              <TabsContent value="statistics" className="mt-0">
                <TabErrorBoundary name="Statistics"><StatisticsDashboard /></TabErrorBoundary>
              </TabsContent>
              <TabsContent value="songs" className="mt-0">
                <TabErrorBoundary name="Songs"><SongsManagementTab /></TabErrorBoundary>
              </TabsContent>
              <TabsContent value="requests" className="mt-0">
                <TabErrorBoundary name="Requests"><RequestedSongsTab /></TabErrorBoundary>
              </TabsContent>
              <TabsContent value="blog" className="mt-0">
                <TabErrorBoundary name="Blog"><ModernBlogTab /></TabErrorBoundary>
              </TabsContent>
              <TabsContent value="feedback" className="mt-0">
                <TabErrorBoundary name="Feedback"><FeedbackTab /></TabErrorBoundary>
              </TabsContent>
              <TabsContent value="uploads" className="mt-0">
                <TabErrorBoundary name="Uploads"><BatchUploadSongs /></TabErrorBoundary>
              </TabsContent>
              <TabsContent value="monetization" className="mt-0">
                <TabErrorBoundary name="Monetization"><MonetizationTab /></TabErrorBoundary>
              </TabsContent>
              <TabsContent value="promotions" className="mt-0">
                <TabErrorBoundary name="Promotions"><PromotionsTab /></TabErrorBoundary>
              </TabsContent>
              <TabsContent value="payments" className="mt-0">
                <TabErrorBoundary name="Payments"><PaymentVerificationTab /></TabErrorBoundary>
              </TabsContent>
              <TabsContent value="security" className="mt-0">
                <TabErrorBoundary name="Security"><SecurityTab /></TabErrorBoundary>
              </TabsContent>
              <TabsContent value="shorts" className="mt-0">
                <TabErrorBoundary name="Shorts"><ShortsManagementTab /></TabErrorBoundary>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;
