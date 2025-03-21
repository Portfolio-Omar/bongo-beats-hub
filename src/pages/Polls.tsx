
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
import { BarChart, Calendar, Users, Timer, Check } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock polls data
const polls = [
  {
    id: '1',
    title: 'Greatest Kenyan Artist of All Time',
    description: 'Vote for who you think is the most influential Kenyan musician in history.',
    startDate: 'Jun 1, 2023',
    endDate: 'Jun 30, 2023',
    status: 'active',
    participants: 234,
    options: [
      { id: '1a', text: 'Fadhili William', votes: 87 },
      { id: '1b', text: 'Ayub Ogada', votes: 65 },
      { id: '1c', text: 'Daudi Kabaka', votes: 42 },
      { id: '1d', text: 'Fundi Konde', votes: 40 }
    ]
  },
  {
    id: '2',
    title: 'Favorite Bongo Era',
    description: 'Which period of Bongo music do you enjoy the most?',
    startDate: 'May 15, 2023',
    endDate: 'Jun 15, 2023',
    status: 'active',
    participants: 178,
    options: [
      { id: '2a', text: '1960s-1970s (Early Pioneers)', votes: 42 },
      { id: '2b', text: '1980s-1990s (Golden Era)', votes: 85 },
      { id: '2c', text: '2000s-2010s (Modern Classics)', votes: 51 }
    ]
  },
  {
    id: '3',
    title: 'Most Influential Music Style',
    description: 'Which East African music style has had the biggest global impact?',
    startDate: 'Apr 10, 2023',
    endDate: 'May 10, 2023',
    status: 'ended',
    participants: 312,
    options: [
      { id: '3a', text: 'Benga', votes: 98 },
      { id: '3b', text: 'Taarab', votes: 76 },
      { id: '3c', text: 'Bongo Flava', votes: 120 },
      { id: '3d', text: 'Afro-Fusion', votes: 18 }
    ]
  }
];

const Polls: React.FC = () => {
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  
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
  
  const calculatePercentage = (votes: number, totalVotes: number) => {
    return totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
  };
  
  const getMaxVotes = (options: any[]) => {
    return Math.max(...options.map(option => option.votes));
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
        
        {/* Polls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {polls.map((poll, index) => {
            const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
            const hasVoted = userVotes[poll.id] !== undefined;
            const maxVotes = getMaxVotes(poll.options);
            
            return (
              <motion.div 
                key={poll.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{poll.title}</CardTitle>
                      <div className={`px-2 py-1 text-xs font-medium rounded ${
                        poll.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {poll.status === 'active' ? 'Active' : 'Ended'}
                      </div>
                    </div>
                    <CardDescription>{poll.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{poll.startDate} - {poll.endDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{poll.participants} votes</span>
                      </div>
                    </div>
                    
                    {poll.options.map(option => {
                      const percentage = calculatePercentage(option.votes, totalVotes);
                      const isSelected = userVotes[poll.id] === option.id;
                      const isEnded = poll.status === 'ended';
                      const isWinner = option.votes === maxVotes && isEnded;
                      
                      return (
                        <div key={option.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {(isSelected || isEnded) && (
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                  isSelected ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                                }`}>
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                              )}
                              <span className={`text-sm font-medium ${isSelected ? 'text-primary' : ''} ${isWinner ? 'text-primary font-semibold' : ''}`}>
                                {option.text}
                              </span>
                            </div>
                            <span className="text-sm font-medium">
                              {hasVoted || isEnded ? `${percentage}%` : ''}
                            </span>
                          </div>
                          
                          {(hasVoted || isEnded) && (
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${isWinner ? 'bg-primary' : 'bg-accent'} rounded-full transition-all duration-1000 ease-out`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                  <CardFooter>
                    {poll.status === 'active' && !userVotes[poll.id] && (
                      <div className="w-full grid grid-cols-2 gap-2">
                        {poll.options.map(option => (
                          <Button 
                            key={option.id}
                            variant="outline"
                            className="w-full text-sm"
                            onClick={() => handleVote(poll.id, option.id)}
                          >
                            {option.text}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    {poll.status === 'active' && userVotes[poll.id] && (
                      <div className="w-full text-center">
                        <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                          <Check className="h-4 w-4" />
                          <span>You've voted in this poll</span>
                        </div>
                      </div>
                    )}
                    
                    {poll.status === 'ended' && (
                      <div className="w-full">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Timer className="h-4 w-4" />
                          <span>This poll has ended</span>
                        </div>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
        
        {/* Poll Results Section */}
        <motion.div 
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-bold mb-2">Poll Results</h2>
            <p className="text-muted-foreground">
              View the latest results from our community polls.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {polls.filter(poll => poll.status === 'ended').map((poll, index) => {
              const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
              
              return (
                <motion.div 
                  key={`results-${poll.id}`}
                  className="music-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
                >
                  <div className="flex items-start mb-4">
                    <BarChart className="h-8 w-8 text-primary mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{poll.title}</h3>
                      <p className="text-sm text-muted-foreground">{poll.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {poll.options
                      .sort((a, b) => b.votes - a.votes)
                      .map(option => {
                        const percentage = calculatePercentage(option.votes, totalVotes);
                        
                        return (
                          <div key={`result-${option.id}`} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{option.text}</span>
                              <span className="text-sm font-medium">{option.votes} votes ({percentage}%)</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Total votes: {totalVotes}</span>
                      <span>Poll ended on {poll.endDate}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Polls;
