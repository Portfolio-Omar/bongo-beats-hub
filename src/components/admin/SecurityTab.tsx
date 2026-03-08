import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Shield, ShieldAlert, ShieldX, UserX, Users, Search, 
  AlertTriangle, Ban, CheckCircle, Eye, Fingerprint, Globe
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserWithRole {
  id: string;
  user_id: string;
  role: string;
}

const SecurityTab: React.FC = () => {
  const [roles, setRoles] = useState<UserWithRole[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [suspensions, setSuspensions] = useState<any[]>([]);
  const [loginActivity, setLoginActivity] = useState<any[]>([]);
  const [fingerprints, setFingerprints] = useState<any[]>([]);
  const [suspendUserId, setSuspendUserId] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [flagUserId, setFlagUserId] = useState('');
  const [flagType, setFlagType] = useState('manual');
  const [flagDescription, setFlagDescription] = useState('');
  const [flagSeverity, setFlagSeverity] = useState('medium');
  const [roleUserId, setRoleUserId] = useState('');
  const [roleToAssign, setRoleToAssign] = useState('admin');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [rolesRes, flagsRes, suspRes, loginRes, fpRes] = await Promise.all([
      supabase.from('user_roles').select('*').order('created_at', { ascending: false }),
      supabase.from('security_flags').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('account_suspensions').select('*').order('suspended_at', { ascending: false }).limit(50),
      supabase.from('login_activity').select('*').order('login_at', { ascending: false }).limit(100),
      supabase.from('device_fingerprints').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    if (rolesRes.data) setRoles(rolesRes.data);
    if (flagsRes.data) setFlags(flagsRes.data);
    if (suspRes.data) setSuspensions(suspRes.data);
    if (loginRes.data) setLoginActivity(loginRes.data);
    if (fpRes.data) setFingerprints(fpRes.data);
  };

  const assignRole = async () => {
    if (!roleUserId.trim()) return toast.error('Enter a user ID');
    const { error } = await supabase.from('user_roles').insert({
      user_id: roleUserId.trim(),
      role: roleToAssign as any,
    });
    if (error) {
      if (error.code === '23505') toast.error('User already has this role');
      else toast.error(error.message);
    } else {
      toast.success(`Role '${roleToAssign}' assigned successfully`);
      setRoleUserId('');
      fetchAll();
    }
  };

  const removeRole = async (id: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Role removed'); fetchAll(); }
  };

  const suspendUser = async () => {
    if (!suspendUserId.trim() || !suspendReason.trim()) return toast.error('Fill in user ID and reason');
    const { error } = await supabase.from('account_suspensions').insert({
      user_id: suspendUserId.trim(),
      reason: suspendReason,
      suspended_by: 'admin',
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Account suspended');
      setSuspendUserId('');
      setSuspendReason('');
      fetchAll();
    }
  };

  const liftSuspension = async (id: string) => {
    const { error } = await supabase.from('account_suspensions').update({
      is_active: false,
      lifted_at: new Date().toISOString(),
      lifted_by: 'admin',
    }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Suspension lifted'); fetchAll(); }
  };

  const addFlag = async () => {
    if (!flagUserId.trim()) return toast.error('Enter a user ID');
    const { error } = await supabase.from('security_flags').insert({
      user_id: flagUserId.trim(),
      flag_type: flagType,
      description: flagDescription || null,
      severity: flagSeverity,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Security flag added');
      setFlagUserId('');
      setFlagDescription('');
      fetchAll();
    }
  };

  const resolveFlag = async (id: string) => {
    const { error } = await supabase.from('security_flags').update({
      resolved: true,
      resolved_by: 'admin',
      resolved_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Flag resolved'); fetchAll(); }
  };

  const detectMultiAccounts = () => {
    const ipMap = new Map<string, Set<string>>();
    fingerprints.forEach(fp => {
      if (fp.ip_address) {
        if (!ipMap.has(fp.ip_address)) ipMap.set(fp.ip_address, new Set());
        ipMap.get(fp.ip_address)!.add(fp.user_id);
      }
    });
    const suspicious = Array.from(ipMap.entries()).filter(([_, users]) => users.size > 1);
    if (suspicious.length === 0) {
      toast.info('No multi-account activity detected');
    } else {
      toast.warning(`Found ${suspicious.length} IP(s) with multiple accounts`);
      suspicious.forEach(async ([ip, userIds]) => {
        for (const uid of userIds) {
          await supabase.from('security_flags').insert({
            user_id: uid,
            flag_type: 'multi_account',
            description: `Multiple accounts from IP: ${ip} (${userIds.size} accounts)`,
            severity: 'high',
          });
        }
      });
      fetchAll();
    }
  };

  const severityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="roles">
        <TabsList className="flex-wrap">
          <TabsTrigger value="roles" className="gap-2"><Shield className="h-4 w-4" />User Roles</TabsTrigger>
          <TabsTrigger value="flags" className="gap-2"><ShieldAlert className="h-4 w-4" />Security Flags</TabsTrigger>
          <TabsTrigger value="suspensions" className="gap-2"><Ban className="h-4 w-4" />Suspensions</TabsTrigger>
          <TabsTrigger value="detection" className="gap-2"><Fingerprint className="h-4 w-4" />Detection</TabsTrigger>
          <TabsTrigger value="activity" className="gap-2"><Eye className="h-4 w-4" />Login Activity</TabsTrigger>
        </TabsList>

        {/* ROLES TAB */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Assign Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Get the user ID from <a href="https://supabase.com/dashboard/project/fyspaszcchdknujhwpfs/auth/users" target="_blank" className="text-primary underline">Supabase Auth Users</a> page.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="User UUID" value={roleUserId} onChange={e => setRoleUserId(e.target.value)} />
                <Select value={roleToAssign} onValueChange={setRoleToAssign}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={assignRole} className="gap-2"><Shield className="h-4 w-4" />Assign Role</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Current Roles ({roles.length})</CardTitle></CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <p className="text-muted-foreground text-sm">No roles assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {roles.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <code className="text-xs bg-background px-2 py-1 rounded">{r.user_id}</code>
                        <Badge variant={r.role === 'admin' ? 'destructive' : 'secondary'}>{r.role}</Badge>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeRole(r.id)}>
                        <UserX className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FLAGS TAB */}
        <TabsContent value="flags" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Add Security Flag</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="User UUID" value={flagUserId} onChange={e => setFlagUserId(e.target.value)} />
                <Select value={flagType} onValueChange={setFlagType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bot_detected">Bot Detected</SelectItem>
                    <SelectItem value="multi_account">Multiple Accounts</SelectItem>
                    <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                    <SelectItem value="manual">Manual Flag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Textarea placeholder="Description" value={flagDescription} onChange={e => setFlagDescription(e.target.value)} />
                <div className="space-y-2">
                  <Select value={flagSeverity} onValueChange={setFlagSeverity}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addFlag} className="w-full gap-2"><ShieldAlert className="h-4 w-4" />Add Flag</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Active Flags ({flags.filter(f => !f.resolved).length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {flags.filter(f => !f.resolved).map(f => (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={severityColor(f.severity) as any}>{f.severity}</Badge>
                        <Badge variant="outline">{f.flag_type.replace('_', ' ')}</Badge>
                      </div>
                      <code className="text-xs text-muted-foreground">{f.user_id}</code>
                      {f.description && <p className="text-sm">{f.description}</p>}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => resolveFlag(f.id)} className="gap-1">
                      <CheckCircle className="h-4 w-4" />Resolve
                    </Button>
                  </div>
                ))}
                {flags.filter(f => !f.resolved).length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">No active flags 🎉</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUSPENSIONS TAB */}
        <TabsContent value="suspensions" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Ban className="h-5 w-5" />Suspend Account</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="User UUID" value={suspendUserId} onChange={e => setSuspendUserId(e.target.value)} />
              <Textarea placeholder="Reason for suspension" value={suspendReason} onChange={e => setSuspendReason(e.target.value)} />
              <Button onClick={suspendUser} variant="destructive" className="gap-2"><Ban className="h-4 w-4" />Suspend Account</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Active Suspensions ({suspensions.filter(s => s.is_active).length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suspensions.filter(s => s.is_active).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                    <div className="space-y-1">
                      <code className="text-xs">{s.user_id}</code>
                      <p className="text-sm">{s.reason}</p>
                      <p className="text-xs text-muted-foreground">Since: {new Date(s.suspended_at).toLocaleDateString()}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => liftSuspension(s.id)} className="gap-1">
                      <CheckCircle className="h-4 w-4" />Lift
                    </Button>
                  </div>
                ))}
                {suspensions.filter(s => s.is_active).length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">No active suspensions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DETECTION TAB */}
        <TabsContent value="detection" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Fingerprint className="h-5 w-5" />Multi-Account Detection</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Scan device fingerprints and IPs to find users with multiple accounts.</p>
                <Button onClick={detectMultiAccounts} className="gap-2"><Search className="h-4 w-4" />Run Detection Scan</Button>
                <p className="text-xs text-muted-foreground">{fingerprints.length} fingerprints tracked</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ShieldX className="h-5 w-5" />Bot Detection Stats</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Bot flags</span>
                    <Badge variant="destructive">{flags.filter(f => f.flag_type === 'bot_detected').length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Multi-account flags</span>
                    <Badge variant="secondary">{flags.filter(f => f.flag_type === 'multi_account').length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Suspicious activity</span>
                    <Badge variant="secondary">{flags.filter(f => f.flag_type === 'suspicious_activity').length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Suspended accounts</span>
                    <Badge variant="destructive">{suspensions.filter(s => s.is_active).length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LOGIN ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Recent Login Activity</CardTitle></CardHeader>
            <CardContent>
              {loginActivity.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No login activity recorded yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {loginActivity.map(a => (
                    <div key={a.id} className={`flex items-center justify-between p-3 rounded-lg ${a.is_suspicious ? 'bg-destructive/10' : 'bg-muted/50'}`}>
                      <div className="space-y-1">
                        <code className="text-xs">{a.user_id}</code>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{a.ip_address || 'Unknown IP'}</span>
                          <span>•</span>
                          <span>{new Date(a.login_at).toLocaleString()}</span>
                        </div>
                      </div>
                      {a.is_suspicious && <Badge variant="destructive">Suspicious</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityTab;
