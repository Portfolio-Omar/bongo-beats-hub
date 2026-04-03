import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, Camera, CheckCircle, Clock, AlertCircle, CreditCard } from 'lucide-react';
import GamificationWidget from '@/components/gamification/GamificationWidget';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { sendEmail } from '@/lib/send-email';

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Registration payment state
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [mpesaCode, setMpesaCode] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfile();
      fetchPaymentStatus();
    }
  }, [isAuthenticated, user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setFullName(data.full_name || '');
      setAvatarUrl(data.avatar_url || '');
    }
    setLoading(false);
  };

  const fetchPaymentStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('registration_payments')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setPaymentStatus(data[0].status);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated!');
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(`${user.id}/${fileName}`, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(`${user.id}/${fileName}`);

    setAvatarUrl(urlData.publicUrl);
    setUploading(false);
    toast.success('Avatar uploaded!');
  };

  const handleSubmitPayment = async () => {
    if (!user || !mpesaCode.trim()) {
      toast.error('Please enter your M-Pesa transaction code');
      return;
    }
    if (mpesaCode.trim().length < 8) {
      toast.error('Invalid M-Pesa code');
      return;
    }
    setSubmittingPayment(true);
    const { error } = await supabase
      .from('registration_payments')
      .insert({
        user_id: user.id,
        mpesa_code: mpesaCode.trim().toUpperCase(),
        amount: 150,
      });

    if (error) {
      toast.error('Failed to submit payment: ' + error.message);
    } else {
      toast.success('Payment submitted! Waiting for admin verification.');
      setPaymentStatus('pending');
      const code = mpesaCode.trim().toUpperCase();
      setMpesaCode('');
      // Email user
      sendEmail('payment_submitted', user.email!, { name: fullName || user.email?.split('@')[0], mpesa_code: code, amount: 150 });
      // Email admin
      sendEmail('admin_payment_submitted', undefined, { name: fullName || user.email, email: user.email, mpesa_code: code, amount: 150 });
    }
    setSubmittingPayment(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground mb-4">Please sign in to manage your profile.</p>
        <Button asChild><Link to="/auth">Sign In</Link></Button>
      </div>
    );
  }

  if (loading) return <div className="container py-20 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="container px-4 py-6 sm:py-8 max-w-2xl space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8 text-primary" />
          My Profile
        </h1>
        <p className="text-muted-foreground mt-1">Manage your personal details</p>
      </motion.div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your name and avatar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {fullName ? fullName[0].toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="h-3.5 w-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <div>
              <p className="font-medium">{fullName || 'Set your name'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
            </div>
          </div>

          <Separator />

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              maxLength={100}
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
          </div>

          <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Registration Payment Card */}
      <Card className={paymentStatus === 'verified' ? 'border-green-500/30 bg-green-500/5' : 'border-primary/20'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Registration Payment</CardTitle>
            </div>
            {paymentStatus === 'verified' && (
              <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>
            )}
            {paymentStatus === 'pending' && (
              <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
            )}
            {paymentStatus === 'rejected' && (
              <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Rejected</Badge>
            )}
          </div>
          <CardDescription>
            {paymentStatus === 'verified'
              ? 'Your registration is verified. You can earn rewards!'
              : 'Pay KSh 150 registration fee to start earning rewards from listening.'}
          </CardDescription>
        </CardHeader>
        {paymentStatus !== 'verified' && (
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-medium text-sm">Payment Instructions:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to M-Pesa → Lipa na M-Pesa → Buy Goods</li>
                <li>Till Number: <span className="font-bold text-foreground">4097548</span></li>
                <li>Amount: <span className="font-bold text-foreground">KSh 150</span></li>
                <li>Enter your M-Pesa PIN and confirm</li>
                <li>Enter the M-Pesa transaction code below</li>
              </ol>
            </div>

            {paymentStatus === 'rejected' && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                Your previous payment was rejected. Please resubmit with a valid code.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mpesaCode">M-Pesa Transaction Code</Label>
              <Input
                id="mpesaCode"
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                placeholder="e.g. SLK7H2BGTY"
                maxLength={20}
                disabled={paymentStatus === 'pending'}
              />
            </div>

            <Button
              onClick={handleSubmitPayment}
              disabled={submittingPayment || paymentStatus === 'pending'}
              className="w-full"
            >
              {paymentStatus === 'pending' ? 'Awaiting Admin Verification...' : submittingPayment ? 'Submitting...' : 'Submit Payment Code'}
            </Button>
          </CardContent>
        )}
      </Card>
      
      {/* Gamification */}
      <GamificationWidget />
    </div>
  );
};

export default Profile;
