
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { toast } from 'sonner';
import { BarChart, Calendar, Users, Timer, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Empty polls data - replacing the mock data
const polls: any[] = [];

const Polls: React.FC = () => {
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const handleVote = (pollId: string, optionId: string) => {
    if (userVotes[pollId]) {
      toast.error("You've already voted in this poll!");
      return;
    }
    
    setUserVotes(prev => ({
      ...prev,
      [pollId]: optionId
    }));
    
    toast.success("Your vote has been recorded!");
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Community Polls
          </motion.h1>
          <motion.p 
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Participate in polls about East African music and share your opinions with the community.
          </motion.p>
        </div>
        
        {/* Empty State or Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading polls...</span>
          </div>
        ) : (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>No Active Polls</CardTitle>
                <CardDescription>
                  There are currently no polls available to vote on.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Check back later for new polls about East African music!
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => toast.info("New polls coming soon!")}>
                  Refresh
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Polls;
