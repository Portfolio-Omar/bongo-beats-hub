import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Check, X, Eye, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SongRequest {
  id: string;
  song_name: string;
  artist_name: string;
  audio_url: string;
  submitted_by_email?: string;
  submitted_by_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

const RequestedSongsTab = () => {
  const [selectedRequest, setSelectedRequest] = useState<SongRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [approvalDetails, setApprovalDetails] = useState({
    title: '',
    artist: '',
    genre: '',
    year: '',
  });
  const queryClient = useQueryClient();

  const { data: songRequests, isLoading } = useQuery({
    queryKey: ['song_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('song_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching song requests:', error);
        throw error;
      }
      
      return data as SongRequest[];
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: 'approved' | 'rejected'; notes?: string }) => {
      const { error } = await supabase
        .from('song_requests')
        .update({
          status,
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin'
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song_requests'] });
      toast.success('Song request reviewed successfully');
      setSelectedRequest(null);
      setAdminNotes('');
      setReviewAction(null);
    },
    onError: (error) => {
      console.error('Error reviewing song request:', error);
      toast.error('Failed to review song request');
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, songData }: { requestId: string; songData: any }) => {
      // First, get the audio file from the request
      const request = songRequests?.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Create the song record
      const { error: songError } = await supabase
        .from('songs')
        .insert({
          title: songData.title,
          artist: songData.artist,
          genre: songData.genre || null,
          year: songData.year || null,
          audio_url: request.audio_url,
          published: true,
          cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80'
        });

      if (songError) throw songError;

      // Update the request status
      const { error: updateError } = await supabase
        .from('song_requests')
        .update({
          status: 'approved',
          admin_notes: 'Approved and added to music library',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin'
        })
        .eq('id', requestId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song_requests'] });
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['admin_songs'] });
      toast.success('Song approved and added to library!');
      setSelectedRequest(null);
      setApprovalDetails({ title: '', artist: '', genre: '', year: '' });
    },
    onError: (error) => {
      console.error('Error approving song:', error);
      toast.error('Failed to approve song');
    }
  });

  const handlePlayAudio = async (request: SongRequest) => {
    // Set the selected request for access in the audio function
    const tempRequest = request;
    
    try {
      // Stop any currently playing audio
      const existingAudio = document.querySelector('audio');
      if (existingAudio) {
        existingAudio.pause();
        existingAudio.currentTime = 0;
      }
      
      // Create and play new audio
      const audio = new Audio(request.audio_url);
      audio.crossOrigin = 'anonymous';
      
      // Add event listeners for better debugging
      audio.addEventListener('loadstart', () => console.log('Audio loading started'));
      audio.addEventListener('canplay', () => console.log('Audio can start playing'));
      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        toast.error('Failed to load audio file');
      });
      
      await audio.play();
      toast.success(`Playing "${request.song_name}" by ${request.artist_name}`);
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio. The file might be corrupted or inaccessible.');
    }
  };

  const handleReview = (request: SongRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setAdminNotes('');
    
    if (action === 'approve') {
      setApprovalDetails({
        title: request.song_name,
        artist: request.artist_name,
        genre: '',
        year: '',
      });
    }
  };

  const handleSubmitReview = () => {
    if (!selectedRequest || !reviewAction) return;

    if (reviewAction === 'approve') {
      if (!approvalDetails.title || !approvalDetails.artist) {
        toast.error('Please fill in the song title and artist');
        return;
      }
      
      approveMutation.mutate({
        requestId: selectedRequest.id,
        songData: approvalDetails
      });
    } else {
      reviewMutation.mutate({
        id: selectedRequest.id,
        status: 'rejected',
        notes: adminNotes
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Requested Songs</h2>
        <Badge variant="outline">
          {songRequests?.filter(r => r.status === 'pending').length || 0} Pending
        </Badge>
      </div>

      <div className="grid gap-4">
        {songRequests?.map((request, index) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{request.song_name}</CardTitle>
                    <p className="text-muted-foreground">by {request.artist_name}</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(request.status)}>
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Submitted by:</strong> {request.submitted_by_name || 'Anonymous'}
                    </div>
                    <div>
                      <strong>Email:</strong> {request.submitted_by_email || 'Not provided'}
                    </div>
                    <div>
                      <strong>Submitted:</strong> {format(new Date(request.created_at), 'PPp')}
                    </div>
                    {request.reviewed_at && (
                      <div>
                        <strong>Reviewed:</strong> {format(new Date(request.reviewed_at), 'PPp')}
                      </div>
                    )}
                  </div>

                  {request.admin_notes && (
                    <div className="p-3 bg-muted rounded-md">
                      <strong>Admin Notes:</strong> {request.admin_notes}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlayAudio(request)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Play
                    </Button>
                    
                    {request.status === 'pending' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReview(request, 'approve')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReview(request, 'reject')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {songRequests?.length === 0 && (
        <div className="text-center py-8">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No song requests yet</p>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Song' : 'Reject Song'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {reviewAction === 'approve' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Song Title</Label>
                  <Input
                    id="title"
                    value={approvalDetails.title}
                    onChange={(e) => setApprovalDetails({ ...approvalDetails, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artist">Artist</Label>
                  <Input
                    id="artist"
                    value={approvalDetails.artist}
                    onChange={(e) => setApprovalDetails({ ...approvalDetails, artist: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre (Optional)</Label>
                  <Input
                    id="genre"
                    value={approvalDetails.genre}
                    onChange={(e) => setApprovalDetails({ ...approvalDetails, genre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year (Optional)</Label>
                  <Input
                    id="year"
                    value={approvalDetails.year}
                    onChange={(e) => setApprovalDetails({ ...approvalDetails, year: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="notes">Rejection Reason</Label>
                <Textarea
                  id="notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={reviewMutation.isPending || approveMutation.isPending}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            >
              {reviewAction === 'approve' ? 'Approve & Add to Library' : 'Reject'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestedSongsTab;