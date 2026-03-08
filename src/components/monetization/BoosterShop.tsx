import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Zap, Clock, Rocket, Crown, Shield, Star } from 'lucide-react';

interface BoosterTier {
  id: string;
  name: string;
  rate_per_song: number;
  duration_hours: number;
  price: number;
  sort_order: number;
}

interface ActiveBooster {
  id: string;
  rate_per_song: number;
  expires_at: string;
  booster_tier_id: string;
}

const tierIcons = [Zap, Rocket, Shield, Crown, Star];

interface BoosterShopProps {
  isRegistered?: boolean;
}

const BoosterShop: React.FC<BoosterShopProps> = ({ isRegistered = false }) => {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<BoosterTier[]>([]);
  const [activeBooster, setActiveBooster] = useState<ActiveBooster | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const [tiersRes, activeRes] = await Promise.all([
      supabase.from('booster_tiers').select('*').eq('is_active', true).order('sort_order'),
      user ? supabase.from('booster_purchases').select('*').eq('user_id', user.id).eq('is_active', true).gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: false }).limit(1) : Promise.resolve({ data: [] }),
    ]);
    if (tiersRes.data) setTiers(tiersRes.data as BoosterTier[]);
    if (activeRes.data && activeRes.data.length > 0) setActiveBooster(activeRes.data[0] as ActiveBooster);
  };

  const handlePurchase = async (tier: BoosterTier) => {
    if (!user) { toast.error('Please sign in first'); return; }
    if (!isRegistered) { toast.error('Pay KSh 150 registration fee before purchasing boosters'); return; }
    if (activeBooster) { toast.error('You already have an active booster. Wait for it to expire.'); return; }
    
    setPurchasing(tier.id);
    try {
      const expiresAt = new Date(Date.now() + tier.duration_hours * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from('booster_purchases').insert({
        user_id: user.id,
        booster_tier_id: tier.id,
        expires_at: expiresAt,
        rate_per_song: tier.rate_per_song,
        price_paid: tier.price,
        payment_method: 'mpesa',
        payment_status: 'completed',
        is_active: true,
      });
      if (error) throw error;
      toast.success(`🚀 ${tier.name} activated! Earning KSh ${tier.rate_per_song}/song for ${tier.duration_hours}h`);
      fetchData();
    } catch {
      toast.error('Purchase failed. Try again.');
    }
    setPurchasing(null);
  };

  const getTimeLeft = () => {
    if (!activeBooster) return '';
    const diff = new Date(activeBooster.expires_at).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-4">
      {!isRegistered && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive font-medium">Pay KSh 150 registration fee to unlock boosters. Go to your Profile to submit payment.</p>
          </CardContent>
        </Card>
      )}
      {activeBooster && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Booster</p>
                <p className="text-2xl font-bold text-yellow-600">KSh {activeBooster.rate_per_song}/song</p>
                <Badge className="mt-1 bg-yellow-500/20 text-yellow-700">
                  <Clock className="h-3 w-3 mr-1" /> {getTimeLeft()} remaining
                </Badge>
              </div>
              <Rocket className="h-10 w-10 text-yellow-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiers.map((tier, i) => {
          const Icon = tierIcons[i % tierIcons.length];
          return (
            <motion.div key={tier.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`relative overflow-hidden ${i >= 3 ? 'border-primary/30' : ''}`}>
                {i === 4 && <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-lg font-bold">BEST VALUE</div>}
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-primary" />
                    {tier.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-3xl font-bold">KSh {tier.price}</p>
                    <p className="text-sm text-muted-foreground">one-time</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>✓ Earn <span className="font-bold text-primary">KSh {tier.rate_per_song}</span> per song</p>
                    <p>✓ Lasts <span className="font-bold">{tier.duration_hours} hours</span></p>
                    <p>✓ Up to <span className="font-bold">KSh {(tier.rate_per_song * 150).toFixed(0)}</span>/day</p>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!!activeBooster || purchasing === tier.id}
                    onClick={() => handlePurchase(tier)}
                  >
                    {purchasing === tier.id ? 'Processing...' : activeBooster ? 'Booster Active' : 'Buy Now'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BoosterShop;
