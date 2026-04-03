import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Flame, Star, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const LEVEL_XP: Record<string, number> = {
  'Beginner': 0, 'Explorer': 100, 'Rising Star': 500, 'Pro': 1000, 'Super Fan': 2000, 'Legend': 5000
};
const LEVELS = ['Beginner', 'Explorer', 'Rising Star', 'Pro', 'Super Fan', 'Legend'];

const GamificationWidget: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { user, isAuthenticated } = useAuth();

  const { data: gamification } = useQuery({
    queryKey: ['user-gamification', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('user_gamification').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: badges } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_badges')
        .select('*, badge_definitions(*)')
        .eq('user_id', user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  if (!isAuthenticated || !user) return null;

  const level = gamification?.level || 'Beginner';
  const xp = gamification?.xp || 0;
  const streak = gamification?.streak_days || 0;
  const levelIdx = LEVELS.indexOf(level);
  const nextLevel = levelIdx < LEVELS.length - 1 ? LEVELS[levelIdx + 1] : null;
  const currentMin = LEVEL_XP[level] || 0;
  const nextMin = nextLevel ? LEVEL_XP[nextLevel] : currentMin;
  const progress = nextLevel ? ((xp - currentMin) / (nextMin - currentMin)) * 100 : 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-gold/50 text-gold gap-1">
          <Star className="h-3 w-3" /> {level}
        </Badge>
        {streak > 0 && (
          <Badge variant="outline" className="border-orange-500/50 text-orange-500 gap-1">
            <Flame className="h-3 w-3" /> {streak}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="border-gold/20 overflow-hidden">
      <div className="bg-gradient-to-r from-gold/10 to-yellow-600/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-gold" />
            <h3 className="font-heading font-bold text-lg">{level}</h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 text-gold" />{xp} XP</span>
            {streak > 0 && <span className="flex items-center gap-1"><Flame className="h-4 w-4 text-orange-500" />{streak} days</span>}
          </div>
        </div>
        {nextLevel && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{level}</span>
              <span>{nextLevel} ({nextMin - xp} XP to go)</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
      {badges && badges.length > 0 && (
        <CardContent className="p-4 pt-3">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Award className="h-3 w-3" /> Badges Earned</p>
          <div className="flex flex-wrap gap-2">
            {badges.map((b: any) => (
              <motion.div key={b.id} initial={{ scale: 0 }} animate={{ scale: 1 }} 
                className="flex items-center gap-1 bg-muted/50 rounded-full px-3 py-1 text-sm"
                title={b.badge_definitions?.description}>
                <span>{b.badge_definitions?.icon}</span>
                <span className="text-xs font-medium">{b.badge_definitions?.name}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default GamificationWidget;
