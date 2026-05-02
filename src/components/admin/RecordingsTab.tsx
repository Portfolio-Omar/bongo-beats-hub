import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Trash2, Save, Film, Download, Share2, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Recording {
  id: string;
  title: string;
  description: string | null;
  recording_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
}

const RecordingsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Record<string, { title: string; description: string }>>({});

  const { data: recordings = [] } = useQuery({
    queryKey: ['admin-recordings'],
    queryFn: async () => {
      const { data } = await supabase.from('live_recordings').select('*').order('created_at', { ascending: false });
      return (data || []) as Recording[];
    },
  });

  const togglePublish = async (rec: Recording) => {
    await supabase.from('live_recordings').update({ is_published: !rec.is_published }).eq('id', rec.id);
    toast.success(rec.is_published ? 'Unpublished' : '🎬 Published to public');
    queryClient.invalidateQueries({ queryKey: ['admin-recordings'] });
  };

  const saveEdits = async (id: string) => {
    const e = editing[id];
    if (!e) return;
    await supabase.from('live_recordings').update({ title: e.title, description: e.description }).eq('id', id);
    toast.success('Saved');
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
    queryClient.invalidateQueries({ queryKey: ['admin-recordings'] });
  };

  const deleteRecording = async (id: string) => {
    if (!confirm('Delete this recording permanently?')) return;
    await supabase.from('live_recordings').delete().eq('id', id);
    toast.success('Deleted');
    queryClient.invalidateQueries({ queryKey: ['admin-recordings'] });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" /> Live Recordings
        </h3>
        <Badge variant="secondary">{recordings.length} total</Badge>
      </div>

      {recordings.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Film className="h-12 w-12 mx-auto opacity-30 mb-3" />
          <p>No recordings yet. Go live to capture sessions.</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {recordings.map(rec => {
            const ed = editing[rec.id];
            return (
              <Card key={rec.id} className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm truncate flex-1">{rec.title}</CardTitle>
                    <Badge variant={rec.is_published ? 'default' : 'secondary'} className="text-[10px]">
                      {rec.is_published ? '✅ Published' : '🔒 Draft'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <video src={rec.recording_url} controls className="w-full aspect-video bg-black rounded" />
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    <span>{format(new Date(rec.created_at), 'PPp')}</span>
                    <span>👁 {rec.view_count} views</span>
                  </div>

                  {ed ? (
                    <>
                      <Input value={ed.title} onChange={e => setEditing(p => ({ ...p, [rec.id]: { ...ed, title: e.target.value } }))}
                        placeholder="Title" className="h-8 text-xs" />
                      <Textarea value={ed.description} onChange={e => setEditing(p => ({ ...p, [rec.id]: { ...ed, description: e.target.value } }))}
                        placeholder="Description" rows={2} className="text-xs" />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => saveEdits(rec.id)} className="flex-1 h-7 text-xs">
                          <Save className="h-3 w-3 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(p => { const n = { ...p }; delete n[rec.id]; return n; })} className="h-7 text-xs">
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs"
                          onClick={() => setEditing(p => ({ ...p, [rec.id]: { title: rec.title, description: rec.description || '' } }))}>
                          Edit
                        </Button>
                        <Button size="sm" variant={rec.is_published ? 'secondary' : 'default'} className="flex-1 h-7 text-xs"
                          onClick={() => togglePublish(rec)}>
                          {rec.is_published ? <><EyeOff className="h-3 w-3 mr-1" /> Unpublish</> : <><Eye className="h-3 w-3 mr-1" /> Publish</>}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => deleteRecording(rec.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" asChild>
                          <a href={rec.recording_url} download={`${rec.title}.webm`}>
                            <Download className="h-3 w-3 mr-1" /> Download
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs"
                          onClick={async () => {
                            const url = `${window.location.origin}/recordings/${rec.id}`;
                            try {
                              if (navigator.share) await navigator.share({ title: rec.title, url });
                              else { await navigator.clipboard.writeText(url); toast.success('Link copied!'); }
                            } catch {}
                          }}>
                          <Share2 className="h-3 w-3 mr-1" /> Share
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs"
                          onClick={() => window.open(`/recordings/${rec.id}`, '_blank')}>
                          <BarChart3 className="h-3 w-3 mr-1" /> Stats
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecordingsTab;
