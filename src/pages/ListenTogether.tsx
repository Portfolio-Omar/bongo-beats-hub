import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, Radio, Hash, LogIn, Loader2, RefreshCw, Music, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { createListenSession, joinListenSession, findSessionByCode, fetchActiveSessions, type LobbySession } from '@/hooks/useListenSession';

const ListenTogether: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [lobby, setLobby] = useState<LobbySession[]>([]);
  const [loadingLobby, setLoadingLobby] = useState(true);

  const loadLobby = useCallback(async () => {
    setLoadingLobby(true);
    const items = await fetchActiveSessions();
    setLobby(items);
    setLoadingLobby(false);
  }, []);

  useEffect(() => {
    loadLobby();
    const iv = setInterval(loadLobby, 30000);
    return () => clearInterval(iv);
  }, [loadLobby]);

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    const session = await createListenSession(user, name.trim());
    setCreating(false);
    if (!session) {
      toast({ title: 'Could not create session', description: 'Please try again.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Session created!', description: `Invite code: ${session.code}` });
    navigate(`/listen/${session.id}`);
  };

  const handleJoinByCode = async () => {
    if (!user || code.trim().length === 0) return;
    setJoining(true);
    const session = await findSessionByCode(code);
    if (!session) {
      setJoining(false);
      toast({ title: 'No active session with that code', variant: 'destructive' });
      return;
    }
    await joinListenSession(session.id, user);
    setJoining(false);
    navigate(`/listen/${session.id}`);
  };

  const handleJoinSession = async (sessionId: string) => {
    if (!user) return;
    const session = await joinListenSession(sessionId, user);
    if (!session) {
      toast({ title: 'That session has ended', variant: 'destructive' });
      loadLobby();
      return;
    }
    navigate(`/listen/${sessionId}`);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-10 px-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-bold">{t('listen_together')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('listen_together_sign_in')}
            </p>
            <Button asChild className="bg-gold hover:bg-gold/90 text-gold-foreground">
              <a href="/auth"><LogIn className="mr-2 h-4 w-4" />{t('sign_in')}</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-16">
      <div className="container mx-auto max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
            {t('listen_together')}
          </h1>
          <p className="text-muted-foreground">{t('listen_together_sub')}</p>
        </div>

        {/* Create + Join */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Radio className="h-5 w-5 text-primary" />{t('create_session')}</CardTitle>
              <CardDescription>{t('create_session_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('session_name_ph')}
                maxLength={60}
              />
              <Button className="w-full bg-gold hover:bg-gold/90 text-gold-foreground" onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Music className="h-4 w-4 mr-2" />}
                {t('create_session')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Hash className="h-5 w-5 text-primary" />{t('join_code')}</CardTitle>
              <CardDescription>{t('join_code_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('enter_code')}
                inputMode="numeric"
                className="text-center font-mono text-xl tracking-[0.4em]"
              />
              <Button className="w-full" variant="outline" onClick={handleJoinByCode} disabled={joining || code.length < 6}>
                {joining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                {t('join_session')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active sessions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold">{t('active_sessions')}</h2>
            <Button size="sm" variant="ghost" onClick={loadLobby}>
              <RefreshCw className={`h-4 w-4 ${loadingLobby ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {!loadingLobby && lobby.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {t('no_active_sessions')}
              </CardContent>
            </Card>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lobby.map(({ session, participant_count }) => (
              <Card key={session.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold truncate">{session.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Crown className="h-3 w-3 text-gold" /> {session.host_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="font-mono">{session.code}</Badge>
                    {session.current_song ? (
                      <Badge variant="outline" className="max-w-[160px] truncate">
                        ♪ {session.current_song.title}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{t('idle')}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                      <Users className="h-3.5 w-3.5" /> {participant_count}
                    </span>
                  </div>
                  <Button size="sm" className="w-full" onClick={() => handleJoinSession(session.id)}>
                    {t('join_session')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListenTogether;
