
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { MessageSquare, Trash2, Mail, Calendar, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackType {
  id: string;
  name: string;
  email: string;
  feedback: string;
  date: string;
  read: boolean;
}

const FeedbackTab: React.FC = () => {
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | null>(null);
  const queryClient = useQueryClient();
  
  // Fetch feedback from Supabase
  const { data: feedbacks = [], isLoading: loadingFeedback } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback' as any)
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching feedback:', error);
        toast.error('Failed to load feedback');
        throw error;
      }
      
      return data as unknown as FeedbackType[];
    }
  });
  
  // Mark feedback as read mutation
  const markFeedbackAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feedback' as any)
        .update({ read: true })
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
    onError: (error) => {
      console.error('Error marking feedback as read:', error);
    }
  });
  
  // Delete feedback mutation
  const deleteFeedbackMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feedback' as any)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      setSelectedFeedback(null);
      toast.success('Feedback deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
    }
  });
  
  // Handle feedback click
  const handleFeedbackClick = (feedback: FeedbackType) => {
    setSelectedFeedback(feedback);
    if (!feedback.read) {
      markFeedbackAsReadMutation.mutate(feedback.id);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Feedback List */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback
          </CardTitle>
          <CardDescription>View user feedback and suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingFeedback ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full mr-2" />
              <span>Loading feedback...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {feedbacks.length > 0 ? (
                feedbacks.map(feedback => (
                  <div
                    key={feedback.id}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-secondary/50 border ${
                      selectedFeedback?.id === feedback.id ? 'bg-secondary' : ''
                    } ${!feedback.read ? 'border-primary' : 'border-border'}`}
                    onClick={() => handleFeedbackClick(feedback)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm">{feedback.name}</h3>
                      <span className="text-xs text-muted-foreground">{feedback.date}</span>
                    </div>
                    <p className="text-xs line-clamp-1">{feedback.feedback.substring(0, 50)}...</p>
                    {!feedback.read && (
                      <div className="mt-2 flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-1"></div>
                        <span className="text-xs text-primary">New feedback</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No feedback available
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Feedback Details */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Details
          </CardTitle>
          <CardDescription>View the complete feedback</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedFeedback ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Feedback from {selectedFeedback.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{selectedFeedback.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{selectedFeedback.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{selectedFeedback.date}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-secondary/50 border border-border min-h-[200px]">
                <p>{selectedFeedback.feedback}</p>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteFeedbackMutation.mutate(selectedFeedback.id)}
                  disabled={deleteFeedbackMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Feedback
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No feedback selected</h3>
              <p className="text-muted-foreground">
                Select a feedback from the list to view its contents
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackTab;
