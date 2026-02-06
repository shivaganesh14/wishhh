import { useState, useEffect, useCallback, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Lock, ArrowLeft, QrCode, Loader2, Eye, Copy, Check, Calendar, Clock, ShieldAlert } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCreatedDate, formatUnlockDate, formatUnlockTime, parseCapsuleTimestamp } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CountdownTimer } from '@/components/CountdownTimer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isValidUUID } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface Capsule {
  id: string;
  title: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  unlock_at: string;
  is_unlocked: boolean;
  is_opened: boolean;
  has_password: boolean;
  open_once: boolean;
  created_at: string;
}

function ViewCapsule() {
  // The URL param is now the share_token (UUID), not the capsule ID
  const { id: shareToken } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [securityError, setSecurityError] = useState(false);
  const [signedMediaUrl, setSignedMediaUrl] = useState<string | null>(null);

  // Use share_token URL for sharing (more secure than ID)
  const capsuleUrl = `${window.location.origin}/capsule/${shareToken}`;

  useEffect(() => {
    if (shareToken) {
      // Validate share token format before making request
      if (!isValidUUID(shareToken)) {
        setSecurityError(true);
        setLoading(false);
        return;
      }
      fetchCapsuleByToken();
    }
  }, [shareToken]);

  const fetchCapsuleByToken = async () => {
    try {
      // Use the secure RPC function that validates by share_token
      const { data, error } = await supabase.rpc('get_capsule_by_share_token', {
        p_share_token: shareToken
      });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setCapsule(null);
        setLoading(false);
        return;
      }

      const capsuleData = data[0] as Capsule;
      setCapsule(capsuleData);
      
      // Check if unlock time has passed using server time
      const unlockDate = parseCapsuleTimestamp(capsuleData.unlock_at);
      const now = new Date();
      setIsReady(now >= unlockDate);
      
      // If open_once is enabled and already opened, don't allow viewing again
      if (capsuleData.open_once && capsuleData.is_opened) {
        setLoading(false);
        return; // Will show "already opened" message below
      }
      
      // If already opened before (without password), show directly
      if (capsuleData.is_opened && !capsuleData.has_password) {
        setIsRevealed(true);
      }
    } catch (error: any) {
      console.error('Error fetching capsule:', error);
      toast({
        variant: 'destructive',
        title: 'Capsule not found',
        description: 'This memory capsule may not exist or has been deleted.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = useCallback(() => {
    setIsReady(true);
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!capsule || !shareToken) return;

    // Validate password input length
    if (passwordInput.length > 100 || passwordInput.length === 0) {
      setPasswordError(true);
      return;
    }

    try {
      // Use secure server-side password verification via edge function
      const { data, error } = await supabase.functions.invoke('verify-capsule-password', {
        body: { shareToken, password: passwordInput }
      });
      
      if (error) throw error;
      
      if (data?.isValid) {
        setPasswordError(false);
        // If edge function returned capsule data (content/media), merge it into state
        if (data?.capsule && capsule) {
          setCapsule({ ...capsule, ...data.capsule });
        }
        revealCapsule();
      } else {
        setPasswordError(true);
      }
    } catch (error) {
      console.error('Password verification error:', error);
      setPasswordError(true);
    }
  };

  // Fetch signed media URL when revealing capsule
  const fetchSignedMediaUrl = async () => {
    if (!capsule?.media_url || !shareToken) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('get-signed-media-url', {
        body: { shareToken, mediaPath: capsule.media_url }
      });
      
      if (error) {
        console.error('Error fetching signed URL:', error);
        return;
      }
      
      if (data?.signedUrl) {
        setSignedMediaUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error fetching signed media URL:', error);
    }
  };

  const revealCapsule = async () => {
    // Prevent revealing if open_once and already opened
    if (capsule?.open_once && capsule.is_opened) {
      toast({
        variant: 'destructive',
        title: 'Already Opened',
        description: 'This capsule can only be opened once and has already been viewed.',
      });
      return;
    }
    
    setIsRevealed(true);
    
    // Fetch signed media URL for private bucket
    await fetchSignedMediaUrl();
    
    if (capsule && !capsule.is_opened && shareToken) {
      // Mark as opened using the secure RPC function
      const { error } = await supabase.rpc('mark_capsule_opened', {
        p_share_token: shareToken
      });
      
      if (error) {
        console.error('Error marking capsule as opened:', error);
      } else {
        // Update local state to reflect it's now opened
        setCapsule({ ...capsule, is_opened: true });
      }
    }
  };

  const handleReveal = () => {
    if (capsule?.has_password && !isRevealed) {
      // Show password prompt
      return;
    }
    revealCapsule();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(capsuleUrl);
    setCopied(true);
    toast({ title: 'Link copied!', description: 'Share this link with your loved ones.' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (securityError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 sm:p-12 rounded-xl sm:rounded-2xl text-center max-w-md w-full"
        >
          <ShieldAlert className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-destructive/50" />
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-3 sm:mb-4">
            Invalid Link
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-body mb-4 sm:mb-6">
            This link appears to be invalid or malformed.
          </p>
          <Button variant="peach" asChild className="w-full sm:w-auto">
            <Link to="/">Go Home</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!capsule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 sm:p-12 rounded-xl sm:rounded-2xl text-center max-w-md w-full"
        >
          <Gift className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-muted-foreground/50" />
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-3 sm:mb-4">
            Capsule Not Found
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-body mb-4 sm:mb-6">
            This memory capsule may not exist or has been removed.
          </p>
          <Button variant="peach" asChild className="w-full sm:w-auto">
            <Link to="/">Go Home</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // Open once: if already opened, show message
  if (capsule.open_once && capsule.is_opened) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 sm:p-12 rounded-xl sm:rounded-2xl text-center max-w-md w-full"
        >
          <Lock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-muted-foreground/50" />
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-3 sm:mb-4">
            Already Opened
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-body mb-4 sm:mb-6">
            This capsule was set to open only once and has already been viewed. The memory has been sealed forever.
          </p>
          <Button variant="peach" asChild className="w-full sm:w-auto">
            <Link to="/">Go Home</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // Locked state - countdown
  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl text-center max-w-lg w-full border-2 border-accent/20"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/20 mb-4 sm:mb-6"
          >
            <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
          </motion.div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            {capsule.title}
          </h1>
          
          <p className="font-script text-lg sm:text-xl text-accent mb-4 sm:mb-6">
            This memory is still sealed...
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 font-label">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Opens {formatUnlockDate(capsule.unlock_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{formatUnlockTime(capsule.unlock_at)}</span>
            </div>
          </div>

          <CountdownTimer 
            unlockAt={parseCapsuleTimestamp(capsule.unlock_at)} 
            onUnlock={handleUnlock}
          />

          <p className="text-xs sm:text-sm text-muted-foreground font-body mt-6 sm:mt-8">
            ✨ Be patient, precious memories are worth the wait ✨
          </p>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border/50">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Password prompt
  if (isReady && capsule.has_password && !isRevealed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl text-center max-w-md w-full"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent/20 mb-4 sm:mb-6">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-accent" />
          </div>

          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">
            Enter Password
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-body mb-4 sm:mb-6">
            This capsule is protected. Enter the password to reveal it.
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                maxLength={100}
                className={cn("text-sm sm:text-base", passwordError && 'border-destructive')}
              />
              {passwordError && (
                <p className="text-xs sm:text-sm text-destructive">Incorrect password</p>
              )}
            </div>
            <Button type="submit" variant="gold" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              Reveal Memory
            </Button>
          </form>

          <div className="mt-4 sm:mt-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Revealed state
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={copyLink} className="flex-1 sm:flex-none">
              {copied ? (
                <Check className="w-4 h-4 mr-1 sm:mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-1 sm:mr-2" />
              )}
              <span className="hidden xs:inline">Copy Link</span>
              <span className="xs:hidden">Copy</span>
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <QrCode className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">QR Code</span>
                  <span className="xs:hidden">QR</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-center font-display">Share via QR Code</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center py-4 sm:py-6">
                  <div className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl shadow-soft">
                    <QRCodeSVG 
                      value={capsuleUrl} 
                      size={180}
                      level="H"
                      includeMargin
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4 text-center font-body px-4">
                    Scan this code to access the capsule or write to an NFC tag
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div
              key="sealed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="glass-card p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl text-center border-2 border-accent/30"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 mb-4 sm:mb-6 animate-glow"
              >
                <Gift className="w-10 h-10 sm:w-12 sm:h-12 text-accent" />
              </motion.div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                {capsule.title}
              </h1>
              
              <p className="font-script text-lg sm:text-xl text-accent mb-6 sm:mb-8">
                Your memory is ready to be revealed!
              </p>

              <Button variant="gold" size="lg" onClick={handleReveal} className="w-full sm:w-auto">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Open Time Capsule
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="glass-card p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl border-2 border-accent/20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="text-center mb-6 sm:mb-8"
              >
                <span className="font-script text-2xl sm:text-3xl md:text-4xl text-accent">
                  ✨ Memory Unlocked ✨
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground text-center mb-4 sm:mb-6"
              >
                {capsule.title}
              </motion.h1>

              {/* Media - using signed URL for private bucket */}
              {capsule.media_url && signedMediaUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl overflow-hidden"
                >
                  {capsule.media_type === 'image' && (
                    <img
                      src={signedMediaUrl}
                      alt="Memory"
                      className="w-full h-auto rounded-xl sm:rounded-2xl"
                      loading="lazy"
                    />
                  )}
                  {capsule.media_type === 'video' && (
                    <video
                      src={signedMediaUrl}
                      controls
                      className="w-full rounded-xl sm:rounded-2xl"
                    />
                  )}
                  {capsule.media_type === 'audio' && (
                    <audio
                      src={signedMediaUrl}
                      controls
                      className="w-full"
                    />
                  )}
                </motion.div>
              )}

              {/* Content - safely rendered */}
              {capsule.content && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="prose prose-sm sm:prose-lg max-w-none"
                >
                  <p className="text-sm sm:text-base text-foreground font-body whitespace-pre-wrap leading-relaxed">
                    {capsule.content}
                  </p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border/50 text-center"
              >
                <p className="text-xs sm:text-sm text-muted-foreground font-label">
                  Created on {formatCreatedDate(capsule.created_at)}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default memo(ViewCapsule);
