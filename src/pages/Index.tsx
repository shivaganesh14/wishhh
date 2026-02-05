import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Clock, Lock, Heart, Sparkles, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import wishhLogo from '@/assets/wishhh-logo.png';

const features = [
  {
    icon: Gift,
    title: 'Create Memories',
    description: 'Capture text, photos, videos, and audio in a beautiful digital capsule.',
  },
  {
    icon: Clock,
    title: 'Set the Date',
    description: 'Choose when your memory will be revealed—days, months, or years from now.',
  },
  {
    icon: Lock,
    title: 'Securely Sealed',
    description: 'Your memories are protected with optional passwords and server-side unlock times.',
  },
  {
    icon: QrCode,
    title: 'Share with QR',
    description: 'Generate a unique QR code to share your capsule with loved ones.',
  },
] as const;

function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-20 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.img 
              src={wishhLogo} 
              alt="Wishhh" 
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto mb-4 sm:mb-6 rounded-full object-cover shadow-glow"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              loading="eager"
            />
            
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent/10 border border-accent/30 mb-4 sm:mb-6">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
              <span className="text-xs sm:text-sm font-label text-accent">Preserve precious moments forever</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-3 sm:mb-4 leading-tight px-2">
              Send Messages
              <br />
              <span className="text-gradient-gold">Through Time</span>
            </h1>
            
            <p className="font-script text-lg sm:text-xl md:text-2xl lg:text-3xl text-accent mb-3 sm:mb-4 px-4">
              "The best time to plant a tree was twenty years ago. The second best time is now."
            </p>
            
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-body max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
              Create a digital time capsule filled with your most treasured memories. 
              Lock it until a special date, then watch it unfold with those you love.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button size="lg" variant="peach" asChild className="text-sm sm:text-base md:text-lg w-full sm:w-auto min-h-[44px] sm:min-h-[48px]">
                <Link to={user ? "/create" : "/auth?mode=signup"}>
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                  <span>Create Your Capsule</span>
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px]">
                <Link to={user ? "/dashboard" : "/auth"}>
                  {user ? 'View My Capsules' : 'Sign In'}
                </Link>
              </Button>
            </div>
          </motion.div>
          
          {/* Floating Decorative Elements - Hidden on mobile/tablet */}
          <motion.div
            className="absolute top-40 left-10 hidden xl:block"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary/40 backdrop-blur-sm border border-secondary/50 flex items-center justify-center">
              <Heart className="w-8 h-8 text-secondary" />
            </div>
          </motion.div>
          
          <motion.div
            className="absolute top-60 right-10 hidden xl:block"
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-20 h-20 rounded-2xl bg-accent/20 backdrop-blur-sm border border-accent/30 flex items-center justify-center">
              <Gift className="w-10 h-10 text-accent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3 sm:mb-4 px-4">
              How It Works
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-body max-w-2xl mx-auto px-4">
              Creating lasting memories has never been easier. Follow these simple steps to preserve your special moments.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-5 sm:p-6 rounded-xl sm:rounded-2xl text-center group hover:shadow-glow transition-all duration-300"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-body">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-6 sm:p-10 md:p-14 rounded-2xl sm:rounded-3xl border-2 border-accent/30"
          >
            <Gift className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-accent" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-3 sm:mb-4 px-2">
              Start Preserving Your Memories Today
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-body mb-6 sm:mb-8 max-w-lg mx-auto px-2">
              Every moment is precious. Don't let your memories fade—capture them in a time capsule and rediscover them when the time is right.
            </p>
            <Button size="lg" variant="gold" asChild className="w-full sm:w-auto">
              <Link to={user ? "/create" : "/auth?mode=signup"}>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Create Your First Capsule
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-xs sm:text-sm text-muted-foreground font-body">
            © {new Date().getFullYear()} Wishhh. Made with{' '}
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 inline text-primary" /> for preserving precious moments.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default memo(Index);
