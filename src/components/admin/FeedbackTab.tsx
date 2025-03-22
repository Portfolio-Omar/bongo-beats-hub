
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, Mail, User, Calendar, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  feedback: string;
  date: string;
  read: boolean | null;
}

const FeedbackTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  
  // Fetch feedback data
  const { data: feedbackList = [], isLoading } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('date', { ascending: false });
        
      if (error) {
        console.error('Error fetching feedback:', error);
        toast.error('Failed to load feedback');
        throw error;
      }
      
      return data as FeedbackItem[];
    }
  });
  
  // Mark feedback as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feedback')
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
        .from('feedback')
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
  const handleFeedbackClick = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    if (!feedback.read) {
      markAsReadMutation.mutate(feedback.id);
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
          <CardDescription>View user feedback submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full mr-2" />
              <span>Loading feedback...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {feedbackList.length > 0 ? (
                feedbackList.map(feedback => (
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
                    <p className="text-xs text-muted-foreground line-clamp-1">{feedback.email}</p>
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
          <CardDescription>Read the complete feedback</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedFeedback ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-1 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedFeedback.name}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedFeedback.email}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedFeedback.date}</span>
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
                Select a feedback item from the list to view its contents
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackTab;
