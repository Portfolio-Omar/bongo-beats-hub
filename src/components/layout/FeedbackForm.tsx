
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

const FeedbackForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !feedback) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          name,
          email,
          feedback,
          date: new Date().toISOString().split('T')[0],
        });
        
      if (error) throw error;
      
      toast.success('Thank you for your feedback!');
      
      // Reset form
      setName('');
      setEmail('');
      setFeedback('');
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Share Your Feedback
          </CardTitle>
          <CardDescription>
            We value your feedback to improve our service
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Share your thoughts, suggestions, or experiences"
                rows={5}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};

export default FeedbackForm;
