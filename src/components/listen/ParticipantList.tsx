import React from 'react';
import { Crown, UserMinus, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ListenParticipant } from '@/hooks/useListenSession';

interface ParticipantListProps {
  participants: ListenParticipant[];
  hostId: string;
  onlineIds: Set<string>;
  currentUserId: string | undefined;
  isHost: boolean;
  onTransfer: (p: ListenParticipant) => void;
  onRemove: (p: ListenParticipant) => void;
  compact?: boolean;
}

const ParticipantList: React.FC<ParticipantListProps> = ({
  participants, hostId, onlineIds, currentUserId, isHost, onTransfer, onRemove, compact,
}) => (
  <div className="space-y-1 p-3">
    {participants.map((p) => {
      const online = onlineIds.has(p.user_id);
      const isSessionHost = p.user_id === hostId;
      const isMe = p.user_id === currentUserId;
      return (
        <div key={p.id} className={cn('flex items-center gap-3 rounded-lg p-2', isMe && 'bg-muted/50')}>
          <div className="relative shrink-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={p.avatar_url || undefined} alt={p.user_name} />
              <AvatarFallback className="text-xs font-bold">{p.user_name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
                online ? 'bg-green-500' : 'bg-muted-foreground/40'
              )}
              title={online ? 'Online' : 'Away'}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate flex items-center gap-1">
              {p.user_name}
              {isSessionHost && <Crown className="h-3.5 w-3.5 text-gold shrink-0" />}
              {isMe && <span className="text-[10px] text-muted-foreground">(you)</span>}
            </p>
            <p className="text-[11px] text-muted-foreground">{online ? 'Listening now' : 'Away'}</p>
          </div>
          {isHost && !isSessionHost && !compact && (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-8 px-2 text-xs gap-1" onClick={() => onTransfer(p)}>
                <ChevronRight className="h-3.5 w-3.5" /> Make Host
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Remove" onClick={() => onRemove(p)}>
                <UserMinus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      );
    })}
    {participants.length === 0 && (
      <p className="text-center text-xs text-muted-foreground py-4">No members yet — share the invite!</p>
    )}
  </div>
);

export default ParticipantList;
