import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Check, ImagePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface PlayerTheme {
  id: string;
  name: string;
  wallpaper_url: string;
  overlay_color: string;
  accent_color: string;
  is_default: boolean;
}

interface ThemeSelectorProps {
  currentTheme: PlayerTheme | null;
  onThemeChange: (theme: PlayerTheme | null, customUrl?: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const { data: themes } = useQuery({
    queryKey: ['player-themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_themes')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data || []) as PlayerTheme[];
    }
  });

  const { data: userPref } = useQuery({
    queryKey: ['user-theme-pref', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_theme_preferences')
        .select('*, player_themes(*)')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    }
  });

  const savePref = useMutation({
    mutationFn: async ({ themeId, customWallpaper }: { themeId?: string; customWallpaper?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_theme_preferences')
        .upsert({
          user_id: user.id,
          theme_id: themeId || null,
          custom_wallpaper_url: customWallpaper || null,
        }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-theme-pref'] });
      toast.success('Theme saved!');
    },
    onError: () => toast.error('Failed to save theme')
  });

  const selectTheme = (theme: PlayerTheme) => {
    onThemeChange(theme);
    if (isAuthenticated) {
      savePref.mutate({ themeId: theme.id });
    }
  };

  const applyCustom = () => {
    if (!customUrl.trim()) return;
    onThemeChange(null, customUrl);
    if (isAuthenticated) {
      savePref.mutate({ customWallpaper: customUrl });
    }
    setCustomUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
          <Palette className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Player Themes</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {/* No theme option */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              onThemeChange(null);
              if (isAuthenticated) savePref.mutate({});
            }}
            className={cn(
              "relative h-28 rounded-xl overflow-hidden border-2 transition-all",
              !currentTheme ? "border-primary ring-2 ring-primary/30" : "border-border/50 hover:border-primary/30"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-background to-card flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Default</span>
            </div>
            {!currentTheme && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </motion.button>

          {themes?.map((theme) => (
            <motion.button
              key={theme.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => selectTheme(theme)}
              className={cn(
                "relative h-28 rounded-xl overflow-hidden border-2 transition-all",
                currentTheme?.id === theme.id
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border/50 hover:border-primary/30"
              )}
            >
              <img src={theme.wallpaper_url} alt={theme.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: theme.overlay_color }} />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-xs font-medium text-white">{theme.name}</span>
              </div>
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full" style={{ background: theme.accent_color }} />
              {currentTheme?.id === theme.id && (
                <div className="absolute top-2 left-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Custom theme */}
        <div className="mt-4 p-4 rounded-xl border border-border/50 space-y-3">
          <Label className="flex items-center gap-2 font-heading">
            <ImagePlus className="h-4 w-4" />
            Custom Wallpaper
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Paste image URL..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="border-border/50"
            />
            <Button onClick={applyCustom} size="sm" disabled={!customUrl.trim()}>
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThemeSelector;
