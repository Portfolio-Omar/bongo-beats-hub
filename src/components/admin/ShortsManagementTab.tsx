import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Short {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  uploaded_by: string | null;
  view_count: number;
  like_count: number;
  published: boolean;
  created_at: string;
}

const ShortsManagementTab: React.FC = () => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShorts = async () => {
    setLoading(true);
    const { data } = await supabase.from('shorts').select('*').order('created_at', { ascending: false });
    if (data) setShorts(data as Short[]);
    setLoading(false);
  };

  useEffect(() => { fetchShorts(); }, []);

  const togglePublished = async (id: string, current: boolean) => {
    const { error } = await supabase.from('shorts').update({ published: !current }).eq('id', id);
    if (error) { toast.error('Failed to update'); return; }
    setShorts(prev => prev.map(s => s.id === id ? { ...s, published: !current } : s));
    toast.success(!current ? 'Published' : 'Unpublished');
  };

  const deleteShort = async (id: string) => {
    if (!confirm('Delete this short permanently?')) return;
    const { error } = await supabase.from('shorts').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setShorts(prev => prev.filter(s => s.id !== id));
    toast.success('Short deleted');
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" /> Shorts Management
        </h2>
        <Badge variant="secondary">{shorts.length} total</Badge>
      </div>

      {shorts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No shorts uploaded yet</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead className="text-center">Views</TableHead>
                <TableHead className="text-center">Likes</TableHead>
                <TableHead className="text-center">Published</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shorts.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{s.title}</TableCell>
                  <TableCell className="text-muted-foreground">{s.uploaded_by || 'Unknown'}</TableCell>
                  <TableCell className="text-center">{s.view_count}</TableCell>
                  <TableCell className="text-center">{s.like_count}</TableCell>
                  <TableCell className="text-center">
                    <Switch checked={s.published} onCheckedChange={() => togglePublished(s.id, s.published)} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(s.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={s.video_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteShort(s.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ShortsManagementTab;
