import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Wallet, TrendingUp, Music, Zap, Clock, Share2, 
  ArrowDownToLine, CreditCard, Smartphone, Building2,
  Shield, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Earnings {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  songs_listened_today: number;
  last_listen_date: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  payment_method: string;
  payment_details: string;
  status: string;
  created_at: string;
}

const Monetization: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [boostActive, setBoostActive] = useState(false);
  const [boostExpiry, setBoostExpiry] = useState<string | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    if (!user) return;
    
    const [earningsRes, boostRes, withdrawRes] = await Promise.all([
      supabase.from('user_earnings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('share_boosts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
      supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ]);

    if (earningsRes.data) {
      setEarnings(earningsRes.data as Earnings);
    } else {
      setEarnings({ balance: 0, total_earned: 0, total_withdrawn: 0, songs_listened_today: 0, last_listen_date: new Date().toISOString() });
    }

    if (boostRes.data && boostRes.data.length > 0) {
      const boost = boostRes.data[0] as any;
      const expiry = new Date(boost.boost_expiry);
      if (expiry > new Date()) {
        setBoostActive(true);
        setBoostExpiry(boost.boost_expiry);
      }
    }

    if (withdrawRes.data) {
      setWithdrawals(withdrawRes.data as Withdrawal[]);
    }

    setLoading(false);
  };

  const handleShare = async () => {
    if (!user) return;
    setSharing(true);

    try {
      const shareUrl = `${window.location.origin}?ref=${user.id.slice(0, 8)}`;
      
      if (navigator.share) {
        await navigator.share({ title: 'Bongo Beats Hub', text: 'Listen to amazing Bongo & Kenyan music!', url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }

      // Record the share boost
      const { error } = await supabase.from('share_boosts').insert({
        user_id: user.id,
        share_date: new Date().toISOString().split('T')[0],
        boost_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      if (!error) {
        setBoostActive(true);
        setBoostExpiry(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
        toast.success('🚀 Boost activated! Earn KSh 3 per song for 24 hours!');
      } else if (error.code === '23505') {
        toast.info('You already shared today. Boost is still active!');
      }
    } catch {
      toast.error('Share failed');
    }
    setSharing(false);
  };

  const handleWithdraw = async () => {
    if (!user || !earnings) return;
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 500) {
      toast.error('Minimum withdrawal is KSh 500');
      return;
    }
    if (amount > earnings.balance) {
      toast.error('Insufficient balance');
      return;
    }
    if (!paymentDetails.trim()) {
      toast.error('Please enter payment details');
      return;
    }

    const { error } = await supabase.from('withdrawals').insert({
      user_id: user.id,
      amount,
      payment_method: paymentMethod,
      payment_details: paymentDetails.trim(),
      status: 'pending'
    });

    if (error) {
      toast.error('Withdrawal request failed');
    } else {
      // Deduct from balance
      await supabase.from('user_earnings').update({
        balance: earnings.balance - amount,
        total_withdrawn: earnings.total_withdrawn + amount
      }).eq('user_id', user.id);

      toast.success('Withdrawal request submitted! Admin will review it.');
      setWithdrawAmount('');
      setPaymentDetails('');
      fetchData();
    }
  };

  const getBoostTimeLeft = () => {
    if (!boostExpiry) return '';
    const diff = new Date(boostExpiry).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign In to Start Earning</h2>
        <p className="text-muted-foreground mb-6">Listen to music and earn KSh rewards!</p>
        <Button onClick={() => navigate('/auth')} className="bg-primary">Sign In</Button>
      </div>
    );
  }

  if (loading) {
    return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;
  }

  const todayProgress = (earnings?.songs_listened_today || 0) / 150 * 100;
  const currentRate = boostActive ? 3 : 1.5;
  const todayEarnings = (earnings?.songs_listened_today || 0) * currentRate;

  return (
    <div className="container py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          💰 Monetization Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Earn KSh by listening to music</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-3xl font-bold text-primary">KSh {(earnings?.balance || 0).toFixed(1)}</p>
                </div>
                <Wallet className="h-10 w-10 text-primary/40" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Earnings</p>
                  <p className="text-3xl font-bold">KSh {todayEarnings.toFixed(1)}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-500/40" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Songs Today</p>
                  <p className="text-3xl font-bold">{earnings?.songs_listened_today || 0}</p>
                  <p className="text-xs text-muted-foreground">/ 150 max</p>
                </div>
                <Music className="h-10 w-10 text-blue-500/40" />
              </div>
              <Progress value={todayProgress} className="mt-3 h-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className={boostActive ? 'border-yellow-500/50 bg-yellow-500/5' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Listening Rate</p>
                  <p className="text-3xl font-bold">KSh {currentRate}</p>
                  {boostActive && (
                    <Badge className="mt-1 bg-yellow-500/20 text-yellow-700">
                      <Zap className="h-3 w-3 mr-1" /> Boosted · {getBoostTimeLeft()}
                    </Badge>
                  )}
                </div>
                <Zap className={`h-10 w-10 ${boostActive ? 'text-yellow-500' : 'text-muted-foreground/40'}`} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Share Boost & Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" /> Share & Boost</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share the platform to double your earning rate from KSh 1.5 → KSh 3 per song for 24 hours!
            </p>
            <Button onClick={handleShare} disabled={sharing} className="w-full bg-gradient-to-r from-primary to-accent">
              <Share2 className="h-4 w-4 mr-2" />
              {sharing ? 'Sharing...' : boostActive ? 'Boost Active ✓' : 'Share & Activate Boost'}
            </Button>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• 1 rewarded share per day</p>
              <p>• Boost lasts 24 hours</p>
              <p>• Max boosted earnings: KSh 450/day</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Earning Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Listen to at least 80% of a song to earn</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Audio must be unmuted and tab active</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <span>30 second cooldown between rewards</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <span>Max 150 songs per day (KSh 225 normal / KSh 450 boosted)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ArrowDownToLine className="h-5 w-5" /> Withdraw Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm text-muted-foreground">Amount (KSh)</label>
              <Input 
                type="number" 
                placeholder="Min 500" 
                value={withdrawAmount} 
                onChange={e => setWithdrawAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa"><div className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> M-Pesa</div></SelectItem>
                  <SelectItem value="bank"><div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Bank Transfer</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                {paymentMethod === 'mpesa' ? 'Phone Number' : 'Account Number'}
              </label>
              <Input 
                placeholder={paymentMethod === 'mpesa' ? '0712345678' : 'Account number'} 
                value={paymentDetails} 
                onChange={e => setPaymentDetails(e.target.value)}
              />
            </div>
            <Button onClick={handleWithdraw} disabled={(earnings?.balance || 0) < 500}>
              <CreditCard className="h-4 w-4 mr-2" /> Withdraw
            </Button>
          </div>
          {(earnings?.balance || 0) < 500 && (
            <p className="text-xs text-muted-foreground mt-2">
              You need KSh {(500 - (earnings?.balance || 0)).toFixed(1)} more to withdraw
            </p>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {withdrawals.map(w => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">KSh {w.amount}</p>
                    <p className="text-xs text-muted-foreground">
                      {w.payment_method.toUpperCase()} · {new Date(w.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={w.status === 'approved' ? 'default' : w.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {w.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lifetime Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Lifetime Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">KSh {(earnings?.total_earned || 0).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </div>
            <div>
              <p className="text-2xl font-bold">KSh {(earnings?.total_withdrawn || 0).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Total Withdrawn</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">KSh {(earnings?.balance || 0).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Available Balance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Monetization;
