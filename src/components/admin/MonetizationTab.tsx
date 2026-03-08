import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Users, Wallet, TrendingUp } from 'lucide-react';
import { sendEmail } from '@/lib/send-email';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_details: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface UserEarning {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  songs_listened_today: number;
}

const MonetizationTab: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [userEarnings, setUserEarnings] = useState<UserEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalPaid: 0, pendingWithdrawals: 0 });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [wRes, eRes] = await Promise.all([
      supabase.from('withdrawals').select('*').order('created_at', { ascending: false }),
      supabase.from('user_earnings').select('*').order('total_earned', { ascending: false })
    ]);

    const w = (wRes.data || []) as WithdrawalRequest[];
    const e = (eRes.data || []) as UserEarning[];
    
    setWithdrawals(w);
    setUserEarnings(e);
    setStats({
      totalUsers: e.length,
      totalPaid: e.reduce((sum, u) => sum + u.total_withdrawn, 0),
      pendingWithdrawals: w.filter(x => x.status === 'pending').length
    });
    setLoading(false);
  };

  const handleWithdrawal = async (id: string, status: 'approved' | 'rejected') => {
    const withdrawal = withdrawals.find(w => w.id === id);
    const { error } = await supabase.from('withdrawals').update({
      status,
      processed_at: new Date().toISOString()
    }).eq('id', id);

    if (error) {
      toast.error('Failed to update withdrawal');
    } else {
      toast.success(`Withdrawal ${status}`);
      if (withdrawal) {
        const emailType = status === 'approved' ? 'withdrawal_approved' : 'withdrawal_rejected';
        sendEmail(emailType, undefined, {
          user_id: withdrawal.user_id,
          amount: withdrawal.amount,
          payment_method: withdrawal.payment_method,
          payment_details: withdrawal.payment_details,
        });
      }
      fetchAll();
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary/50" />
              <div>
                <p className="text-sm text-muted-foreground">Active Earners</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500/50" />
              <div>
                <p className="text-sm text-muted-foreground">Total Paid Out</p>
                <p className="text-2xl font-bold">KSh {stats.totalPaid.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500/50" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
                <p className="text-2xl font-bold">{stats.pendingWithdrawals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="withdrawals">
        <TabsList>
          <TabsTrigger value="withdrawals">Withdrawal Requests</TabsTrigger>
          <TabsTrigger value="users">User Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals" className="space-y-3 mt-4">
          {withdrawals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No withdrawal requests yet</p>
          ) : (
            withdrawals.map(w => (
              <Card key={w.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-semibold">KSh {w.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        {w.payment_method.toUpperCase()} · {w.payment_details}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        User: {w.user_id.slice(0, 8)}... · {new Date(w.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        w.status === 'approved' ? 'default' : 
                        w.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {w.status}
                      </Badge>
                      {w.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => handleWithdrawal(w.id, 'approved')} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleWithdrawal(w.id, 'rejected')}>
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <div className="space-y-2">
            {userEarnings.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">User: {u.user_id.slice(0, 8)}...</p>
                  <p className="text-xs text-muted-foreground">Today: {u.songs_listened_today} songs</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">KSh {u.balance.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Earned: KSh {u.total_earned.toFixed(1)}</p>
                </div>
              </div>
            ))}
            {userEarnings.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No users earning yet</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonetizationTab;
