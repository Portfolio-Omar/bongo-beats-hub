import React, { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type Notif = {
  id: string; type: string; title: string; body: string | null;
  link: string | null; read: boolean; created_at: string;
};

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setItems((data as Notif[]) || []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    // Continue-listening prompt from localStorage
    try {
      const raw = localStorage.getItem('podcast:continue');
      if (raw) {
        const c = JSON.parse(raw);
        if (c && c.id && c.position > 30 && Date.now() - (c.at || 0) < 7 * 86400000) {
          setItems(prev => [{
            id: 'continue-' + c.id,
            type: 'continue',
            title: `Continue listening: ${c.title}`,
            body: `You stopped at ${Math.floor(c.position / 60)}:${String(Math.floor(c.position % 60)).padStart(2, '0')}`,
            link: `/podcasts?ep=${c.id}`,
            read: false,
            created_at: new Date(c.at).toISOString(),
          }, ...prev]);
        }
      }
    } catch {}

    const ch = supabase
      .channel(`notifs-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        const n = payload.new as Notif;
        setItems(prev => [n, ...prev]);
        toast(n.title, { description: n.body || undefined, action: n.link ? { label: 'Open', onClick: () => navigate(n.link!) } : undefined });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const unread = items.filter(i => !i.read).length;

  const markAllRead = async () => {
    if (!user) return;
    await (supabase as any).from('user_notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setItems(prev => prev.map(i => ({ ...i, read: true })));
  };

  const openNotif = async (n: Notif) => {
    if (!n.id.startsWith('continue-')) {
      await (supabase as any).from('user_notifications').update({ read: true }).eq('id', n.id);
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] bg-red-500 text-white border-0">
              {unread > 99 ? '99+' : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="font-medium text-sm">Notifications</div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              <Check className="h-3 w-3 mr-1"/> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">No notifications yet.</p>
          ) : (
            <div className="divide-y">
              {items.map(n => (
                <button key={n.id} onClick={() => openNotif(n)} className={`w-full text-left p-3 hover:bg-muted/60 transition ${n.read ? '' : 'bg-primary/5'}`}>
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</div>}
                  <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
