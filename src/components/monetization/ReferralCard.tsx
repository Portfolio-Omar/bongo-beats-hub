import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Users, Copy, Gift, CheckCircle2 } from 'lucide-react';

interface Referral {
  id: string;
  referred_id: string;
  referred_songs_count: number;
  bonus_paid: boolean;
  bonus_amount: number;
  created_at: string;
}

interface ReferralCardProps {
  isRegistered?: boolean;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ isRegistered = false }) => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchReferralData();
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;
    
    const [earningsRes, referralsRes] = await Promise.all([
      supabase.from('user_earnings').select('referral_code').eq('user_id', user.id).maybeSingle(),
      supabase.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
    ]);

    if (earningsRes.data?.referral_code) {
      setReferralCode(earningsRes.data.referral_code);
    }
    if (referralsRes.data) {
      setReferrals(referralsRes.data as Referral[]);
    }
    setLoading(false);
  };

  const copyReferralLink = async () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    await navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  const shareReferralLink = async () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    if (navigator.share) {
      await navigator.share({
        title: 'Join Bongo Beats Hub',
        text: 'Sign up and start earning KSh by listening to music!',
        url: link,
      });
    } else {
      copyReferralLink();
    }
  };

  const completedReferrals = referrals.filter(r => r.bonus_paid).length;
  const pendingReferrals = referrals.filter(r => !r.bonus_paid).length;
  const totalEarned = completedReferrals * 10;

  if (loading) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Invite friends and earn <span className="font-bold text-primary">KSh 10</span> when they listen to 10 songs!
        </p>
        {!isRegistered && <p className="text-xs text-destructive mt-1">Pay KSh 150 registration fee to earn referral bonuses</p>}

        {referralCode && (
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-md bg-muted text-sm font-mono">
              {`${window.location.origin}/auth?ref=${referralCode}`}
            </code>
            <Button size="icon" variant="outline" onClick={copyReferralLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={shareReferralLink} className="flex-1">
            <Users className="h-4 w-4 mr-2" /> Share Invite Link
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{referrals.length}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-green-600">{completedReferrals}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-primary">KSh {totalEarned}</p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </div>
        </div>

        {referrals.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Referrals</p>
            {referrals.slice(0, 5).map(ref => (
              <div key={ref.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  {ref.bonus_paid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Gift className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm">Friend #{ref.id.slice(0, 6)}</p>
                    <Progress value={(ref.referred_songs_count / 10) * 100} className="h-1.5 w-24 mt-1" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{ref.referred_songs_count}/10 songs</p>
                  <Badge variant={ref.bonus_paid ? 'default' : 'secondary'} className="text-xs">
                    {ref.bonus_paid ? 'KSh 10 Paid' : 'Pending'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
