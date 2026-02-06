import { motion } from 'framer-motion';
import { Lock, Unlock, Clock, Gift, Trash2 } from 'lucide-react';
import { formatUnlockDateTime, parseCapsuleTimestamp } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface CapsuleCardProps {
  id: string;
  title: string;
  unlockAt: string;
  isUnlocked: boolean;
  isOpened: boolean;
  recipientEmail?: string | null;
  shareToken?: string;
  onView: () => void;
  onDelete: (id: string) => void;
}

export function CapsuleCard({ 
  id, 
  title, 
  unlockAt, 
  isUnlocked, 
  isOpened,
  recipientEmail,
  onView,
  onDelete
}: CapsuleCardProps) {
  const unlockDate = parseCapsuleTimestamp(unlockAt);
  const now = new Date();
  const isReady = now >= unlockDate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`glass-card overflow-hidden ${isReady ? 'border-accent/50' : ''}`}>
        <CardHeader className="p-4 sm:pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl shrink-0 ${isReady ? 'bg-accent/20' : 'bg-secondary/30'}`}>
                {isReady ? (
                  <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                ) : (
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-foreground/70" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base sm:text-lg font-semibold text-foreground line-clamp-1">
                  {title}
                </h3>
                {recipientEmail && (
                  <p className="text-xs text-muted-foreground font-label flex items-center gap-1 truncate">
                    <Gift className="w-3 h-3 shrink-0" />
                    <span className="truncate">For: {recipientEmail}</span>
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(id)}
              className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8 sm:h-9 sm:w-9"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 font-label">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">
              {isReady ? 'Unlocked ' : 'Unlocks '}
              {formatUnlockDateTime(unlockAt)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={isReady ? "gold" : "secondary"}
              size="sm"
              className="flex-1 text-xs sm:text-sm"
              onClick={onView}
            >
              {isReady ? (isOpened ? 'View Again' : 'Open Capsule') : 'View Countdown'}
            </Button>
          </div>
          
          {isReady && !isOpened && (
            <motion.div 
              className="mt-2 sm:mt-3 text-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-xs font-script text-accent">
                ✨ Ready to reveal your memory ✨
              </span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
