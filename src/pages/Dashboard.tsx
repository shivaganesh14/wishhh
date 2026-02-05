import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { CapsuleCard } from '@/components/CapsuleCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Capsule {
  id: string;
  title: string;
  unlock_at: string;
  is_unlocked: boolean;
  is_opened: boolean;
  recipient_email: string | null;
  created_at: string;
  share_token: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCapsules();
    }
  }, [user]);

  const fetchCapsules = async () => {
    try {
      const { data, error } = await supabase
        .from('capsules')
        .select('id, title, unlock_at, is_unlocked, is_opened, recipient_email, created_at, share_token')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCapsules(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load your capsules.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('capsules')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setCapsules(capsules.filter(c => c.id !== deleteId));
      toast({
        title: 'Capsule deleted',
        description: 'Your time capsule has been removed.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete the capsule.',
      });
    } finally {
      setDeleteId(null);
    }
  };

  // Navigate using share_token for secure URLs
  const handleView = (shareToken: string) => {
    navigate(`/capsule/${shareToken}`);
  };

  if (authLoading || loading) {
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
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-1 sm:mb-2">
                My Time Capsules
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground font-body">
                Manage and view all your precious memories
              </p>
            </div>
            <Button variant="peach" size="lg" asChild className="w-full sm:w-auto">
              <Link to="/create">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                New Capsule
              </Link>
            </Button>
          </motion.div>

          {capsules.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 sm:p-12 rounded-xl sm:rounded-2xl text-center"
            >
              <Gift className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-accent/50" />
              <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground mb-2">
                No capsules yet
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground font-body mb-4 sm:mb-6 max-w-md mx-auto">
                Start preserving your memories by creating your first time capsule. 
                It's easy and meaningful!
              </p>
              <Button variant="gold" size="lg" asChild className="w-full sm:w-auto">
                <Link to="/create">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Create Your First Capsule
                </Link>
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {capsules.map((capsule) => (
                <CapsuleCard
                  key={capsule.id}
                  id={capsule.id}
                  title={capsule.title}
                  unlockAt={capsule.unlock_at}
                  isUnlocked={capsule.is_unlocked}
                  isOpened={capsule.is_opened}
                  recipientEmail={capsule.recipient_email}
                  shareToken={capsule.share_token}
                  onView={() => handleView(capsule.share_token)}
                  onDelete={setDeleteId}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Capsule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your memory and all its contents will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
