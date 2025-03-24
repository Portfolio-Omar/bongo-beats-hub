
import React, { useState, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { BarChart, Calendar, Users, Timer, Check, Loader2, Vote } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  startDate: string;
  endDate: string;
  status: 'draft' | 'scheduled' | 'active' | 'ended';
  participants: number;
}

const Polls: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchPolls();
  }, []);
  
  const fetchPolls = async () => {
    setIsLoading(true);
    try {
      // Fetch active polls
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: false });
        
      if (pollsError) {
        console.error('Error fetching polls:', pollsError);
        toast.error('Failed to load polls');
        throw pollsError;
      }
      
      if (!pollsData || pollsData.length === 0) {
        setIsLoading(false);
        setPolls([]);
        return;
      }
      
      // Fetch options for each poll
      const pollsWithOptions = await Promise.all(
        pollsData.map(async (poll) => {
          const { data: optionsData, error: optionsError } = await supabase
            .from('poll_options')
            .select('*')
            .eq('poll_id', poll.id);
            
          if (optionsError) {
            console.error(`Error fetching options for poll ${poll.id}:`, optionsError);
            return null;
          }
          
          // Calculate total votes
          const totalVotes = optionsData?.reduce((sum, option) => sum + (option.votes || 0), 0) || 0;
          
          return {
            id: poll.id,
            title: poll.title,
            description: poll.description,
            startDate: poll.start_date,
            endDate: poll.end_date,
            status: poll.status,
            participants: poll.participants || totalVotes,
            options: optionsData?.map(option => ({
              id: option.id,
              text: option.text,
              votes: option.votes || 0
            })) || []
          };
        })
      );
      
      // Filter out nulls
      setPolls(pollsWithOptions.filter(Boolean) as Poll[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVote = async (pollId: string, optionId: string) => {
    if (userVotes[pollId]) {
      toast.error("You've already voted in this poll!");
      return;
    }
    
    try {
      // Find the poll and option
      const poll = polls.find(p => p.id === pollId);
      const option = poll?.options.find(o => o.id === optionId);
      
      if (!poll || !option) {
        toast.error("Cannot find poll or option");
        return;
      }
      
      // Update vote count in the database
      const { error: updateError } = await supabase
        .from('poll_options')
        .update({ votes: (option.votes || 0) + 1 })
        .eq('id', optionId);
        
      if (updateError) {
        console.error('Error updating vote:', updateError);
        toast.error('Failed to record your vote');
        throw updateError;
      }
      
      // Update participants count
      const { error: pollUpdateError } = await supabase
        .from('polls')
        .update({ participants: (poll.participants || 0) + 1 })
        .eq('id', pollId);
        
      if (pollUpdateError) {
        console.error('Error updating poll participants:', pollUpdateError);
      }
      
      // Update local state
      setUserVotes(prev => ({
        ...prev,
        [pollId]: optionId
      }));
      
      // Update polls state
      setPolls(prev => 
        prev.map(p => {
          if (p.id === pollId) {
            return {
              ...p,
              participants: (p.participants || 0) + 1,
              options: p.options.map(o => {
                if (o.id === optionId) {
                  return { ...o, votes: (o.votes || 0) + 1 };
                }
                return o;
              })
            };
          }
          return p;
        })
      );
      
      toast.success("Your vote has been recorded!");
    } catch (error) {
      console.error('Vote error:', error);
    }
  };
  
  // Calculate percent for each option
  const getVotePercent = (votes: number, totalVotes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
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
        
        {/* Poll List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-16 col-span-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading polls...</span>
            </div>
          ) : polls.length > 0 ? (
            polls.map((poll) => {
              const totalVotes = poll.options.reduce((sum, option) => sum + (option.votes || 0), 0);
              const hasVoted = userVotes[poll.id];
              
              return (
                <Card key={poll.id} className="overflow-hidden">
                  <CardHeader className="bg-primary/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{poll.title}</CardTitle>
                        <CardDescription className="mt-2">{poll.description}</CardDescription>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs bg-primary/10 rounded px-2 py-1 flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {poll.participants || 0} votes
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 flex items-center">
                          <Timer className="h-3 w-3 mr-1" />
                          Ends: {poll.endDate}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {poll.options.map((option) => {
                        const percent = getVotePercent(option.votes, totalVotes);
                        const isSelected = hasVoted && hasVoted === option.id;
                        
                        return (
                          <div key={option.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium flex items-center">
                                {isSelected && <Check className="h-3 w-3 text-green-500 mr-1" />}
                                {option.text}
                              </span>
                              {(hasVoted || totalVotes > 0) && (
                                <span className="text-sm font-medium">{percent}%</span>
                              )}
                            </div>
                            {(hasVoted || totalVotes > 0) ? (
                              <div className="relative">
                                <Progress 
                                  value={percent} 
                                  className={`h-2 ${isSelected ? 'bg-primary/20' : 'bg-secondary/50'}`}
                                  indicatorClassName={isSelected ? 'bg-primary' : 'bg-primary/40'}
                                />
                                <div className="text-xs mt-1 text-muted-foreground">
                                  {option.votes} votes
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-left justify-start hover:bg-primary/5 hover:text-primary"
                                onClick={() => handleVote(poll.id, option.id)}
                              >
                                <Vote className="h-3 w-3 mr-2" />
                                Vote for this option
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/10 flex justify-between">
                    {!hasVoted ? (
                      <p className="text-xs text-muted-foreground">Select an option to vote</p>
                    ) : (
                      <p className="text-xs text-green-600 flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        Thanks for voting!
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground">{`${poll.startDate} - ${poll.endDate}`}</span>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <motion.div
              className="text-center py-12 col-span-full"
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
                  <Button variant="outline" className="w-full" onClick={() => fetchPolls()}>
                    Refresh
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Polls;
