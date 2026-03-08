import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { sendEmail } from '@/lib/send-email';

interface Payment {
  id: string;
  user_id: string;
  mpesa_code: string;
  amount: number;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profile?: { full_name: string | null };
}

const PaymentVerificationTab: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    setLoading(true);
    let query = supabase
      .from('registration_payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error('Failed to load payments');
      setLoading(false);
      return;
    }

    // Fetch profiles for user names
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const enriched = data.map(p => ({
        ...p,
        profile: profileMap.get(p.user_id) || { full_name: null },
      }));
      setPayments(enriched);
    } else {
      setPayments([]);
    }
    setLoading(false);
  };

  const handleVerify = async (paymentId: string) => {
    const { error } = await supabase
      .from('registration_payments')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: 'admin',
        admin_notes: notes[paymentId] || null,
      })
      .eq('id', paymentId);

    if (error) {
      toast.error('Failed to verify');
    } else {
      toast.success('Payment verified!');
      fetchPayments();
    }
  };

  const handleReject = async (paymentId: string) => {
    const { error } = await supabase
      .from('registration_payments')
      .update({
        status: 'rejected',
        admin_notes: notes[paymentId] || 'Payment rejected',
      })
      .eq('id', paymentId);

    if (error) {
      toast.error('Failed to reject');
    } else {
      toast.success('Payment rejected');
      fetchPayments();
    }
  };

  const filtered = payments.filter(p =>
    !search || p.mpesa_code.toLowerCase().includes(search.toLowerCase()) ||
    p.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          {(['pending', 'verified', 'rejected', 'all'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'pending' && <Clock className="h-3.5 w-3.5 mr-1" />}
              {f === 'verified' && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
              {f === 'rejected' && <XCircle className="h-3.5 w-3.5 mr-1" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-60"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No payments found</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(payment => (
            <Card key={payment.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {payment.profile?.full_name || `User ${payment.user_id.slice(0, 8)}...`}
                      </span>
                      <Badge variant={
                        payment.status === 'verified' ? 'default' :
                        payment.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {payment.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-mono text-muted-foreground">
                      M-Pesa: <span className="text-foreground font-bold">{payment.mpesa_code}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      KSh {payment.amount} • {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {payment.status === 'pending' && (
                    <div className="flex flex-col gap-2 sm:items-end">
                      <Input
                        placeholder="Admin notes (optional)"
                        value={notes[payment.id] || ''}
                        onChange={(e) => setNotes(prev => ({ ...prev, [payment.id]: e.target.value }))}
                        className="w-full sm:w-48 text-sm h-8"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleVerify(payment.id)} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Verify
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(payment.id)}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentVerificationTab;
