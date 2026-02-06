import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Gift, Calendar, Lock, Mail, Upload, Loader2, X, Image, Video, Music } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { createCapsuleSchema } from '@/lib/validation';

export default function CreateCapsule() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState<Date>();
  const [unlockTime, setUnlockTime] = useState('12:00');
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [openOnce, setOpenOnce] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please select a file smaller than 50MB.',
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['image/', 'video/', 'audio/'];
      if (!allowedTypes.some(type => file.type.startsWith(type))) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please select an image, video, or audio file.',
        });
        return;
      }

      setMediaFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setMediaPreview(null);
      }
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const getMediaIcon = () => {
    if (!mediaFile) return null;
    if (mediaFile.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mediaFile.type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mediaFile.type.startsWith('audio/')) return <Music className="w-4 h-4" />;
    return <Upload className="w-4 h-4" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with Zod schema
    const validationResult = createCapsuleSchema.safeParse({
      title,
      content: content || null,
      recipientEmail: recipientEmail || null,
      password: hasPassword ? password : '',
      unlockDate,
      unlockTime,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Build exact unlock instant from calendar date + time input (user's local time).
    // Extract date parts directly from the calendar Date to avoid any timezone conversion issues.
    const [hours, minutes] = unlockTime.split(':').map(Number);
    // Ensure we're working with the calendar's local date representation
    const calDate = new Date(unlockDate!);
    // Get local date components (not UTC) to preserve the exact day/month/year the user selected
    const y = calDate.getFullYear();
    const m = calDate.getMonth(); // 0-indexed: 0=Jan, 11=Dec
    const d = calDate.getDate();
    // Build new Date using local timezone (no UTC conversion until toISOString())
    const unlockAt = new Date(y, m, d, hours, minutes, 0, 0);

    if (unlockAt <= new Date()) {
      toast({
        variant: 'destructive',
        title: 'Invalid date',
        description: 'The unlock date must be in the future.',
      });
      return;
    }

    setLoading(true);

    try {
      let mediaUrl = null;
      let mediaType = null;

      // Upload media if provided
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('capsule-media')
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        // Store the file path (not public URL - bucket is now private)
        // Media will be accessed via signed URLs through edge function
        mediaUrl = fileName;
        mediaType = mediaFile.type.split('/')[0]; // 'image', 'video', 'audio'
      }

      // Secure server-side password hashing using PBKDF2 via edge function
      let passwordHash = null;
      if (hasPassword && password) {
        const { data: hashData, error: hashError } = await supabase.functions.invoke('hash-capsule-password', {
          body: { action: 'hash', password }
        });
        
        if (hashError) throw hashError;
        passwordHash = hashData.hash;
      }

      // Insert capsule - share_token is auto-generated
      const { data, error } = await supabase
        .from('capsules')
        .insert({
          owner_id: user!.id,
          title: title.trim(),
          content: content.trim() || null,
          media_url: mediaUrl,
          media_type: mediaType,
          unlock_at: unlockAt.toISOString(),
          has_password: hasPassword && !!password,
          password_hash: passwordHash,
          recipient_email: recipientEmail.trim() || null,
          open_once: openOnce,
        })
        .select('share_token')
        .single();

      if (error) throw error;

      toast({
        title: 'Capsule created! ✨',
        description: 'Your memory has been sealed until the unlock date.',
      });

      // Navigate using the share_token (secure URL)
      navigate(`/capsule/${data.share_token}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create capsule.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button variant="ghost" size="sm" asChild className="mb-4 sm:mb-6">
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>

            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-accent/20 mb-3 sm:mb-4">
                <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
                Create Memory Capsule
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground font-body px-4">
                Seal your precious moment and set it free in the future
              </p>
            </div>

            <form onSubmit={handleSubmit} className="glass-card p-5 sm:p-8 rounded-xl sm:rounded-2xl space-y-5 sm:space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="font-label">
                  Title *
                </Label>
                <Input
                  id="title"
                  placeholder="Give your memory a meaningful title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="content" className="font-label">
                  Your Message
                </Label>
                <Textarea
                  id="content"
                  placeholder="Write your heartfelt message here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  maxLength={10000}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {content.length}/10,000 characters
                </p>
              </div>

              {/* Media Upload */}
              <div className="space-y-2">
                <Label className="font-label">Attach Media (Optional)</Label>
                {mediaFile ? (
                  <div className="relative p-4 rounded-xl bg-muted/50 border border-border">
                    <button
                      type="button"
                      onClick={removeMedia}
                      className="absolute top-2 right-2 p-1 rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {mediaPreview ? (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        className="max-h-48 rounded-lg mx-auto"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        {getMediaIcon()}
                        <span className="text-sm font-body truncate">{mediaFile.name}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-lg sm:rounded-xl border-2 border-dashed border-border hover:border-accent/50 cursor-pointer transition-colors">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground mb-2" />
                    <span className="text-xs sm:text-sm text-muted-foreground font-body text-center">
                      Click to upload image, video, or audio
                    </span>
                    <span className="text-xs text-muted-foreground/70 mt-1">
                      Max 50MB
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*,audio/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Unlock Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-label text-sm">Unlock Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal text-sm",
                          !unlockDate && "text-muted-foreground",
                          errors.unlockDate && "border-destructive"
                        )}
                      >
                        <Calendar className="w-4 h-4 mr-2 shrink-0" />
                        <span className="truncate">{unlockDate ? format(unlockDate, "PPP") : "Pick a date"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={unlockDate}
                        onSelect={setUnlockDate}
                        disabled={(date) => {
                          const d = new Date(date);
                          d.setHours(0, 0, 0, 0);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return d < today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.unlockDate && (
                    <p className="text-xs sm:text-sm text-destructive">{errors.unlockDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unlockTime" className="font-label text-sm">
                    Unlock Time
                  </Label>
                  <Input
                    id="unlockTime"
                    type="time"
                    value={unlockTime}
                    onChange={(e) => setUnlockTime(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Recipient Email */}
              <div className="space-y-2">
                <Label htmlFor="recipientEmail" className="font-label text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Recipient Email (Optional)
                </Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="recipient@email.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  maxLength={255}
                  className={cn("text-sm", errors.recipientEmail && 'border-destructive')}
                />
                {errors.recipientEmail && (
                  <p className="text-xs sm:text-sm text-destructive">{errors.recipientEmail}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  They'll receive a notification when the capsule unlocks
                </p>
              </div>

              {/* Password Protection */}
              <div className="space-y-3 sm:space-y-4 p-4 rounded-lg sm:rounded-xl bg-muted/30">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="hasPassword" className="font-label text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password Protection
                  </Label>
                  <Switch
                    id="hasPassword"
                    checked={hasPassword}
                    onCheckedChange={setHasPassword}
                  />
                </div>
                {hasPassword && (
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Enter a password (min 4 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      maxLength={100}
                      className={cn("text-sm", errors.password && 'border-destructive')}
                    />
                    {errors.password && (
                      <p className="text-xs sm:text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Open Once */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-lg sm:rounded-xl bg-muted/30">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="openOnce" className="font-label text-sm">
                    Open Once Only
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Capsule disappears after being viewed
                  </p>
                </div>
                <Switch
                  id="openOnce"
                  checked={openOnce}
                  onCheckedChange={setOpenOnce}
                />
              </div>

              <Button
                type="submit"
                variant="peach"
                size="lg"
                className="w-full text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sealing your memory...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Create Time Capsule
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
