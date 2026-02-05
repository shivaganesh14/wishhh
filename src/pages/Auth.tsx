import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Mail, Lock, User, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const { signIn, signUp, user, resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for password reset mode from URL
    const urlMode = searchParams.get('mode');
    if (urlMode === 'signup') {
      setMode('signup');
    } else if (urlMode === 'reset') {
      setMode('reset');
    } else if (urlMode === 'forgot') {
      setMode('forgot');
    }
  }, [searchParams]);

  useEffect(() => {
    // Redirect logged in users (except when resetting password)
    if (user && mode !== 'reset') {
      navigate('/dashboard');
    }
  }, [user, mode, navigate]);

  const validateForm = () => {
    try {
      if (mode === 'signup') {
        signupSchema.parse({ email, password, confirmPassword, fullName });
      } else if (mode === 'reset') {
        resetPasswordSchema.parse({ password, confirmPassword });
      } else if (mode === 'forgot') {
        z.string().email('Please enter a valid email address').parse(email);
      } else {
        loginSchema.parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: 'destructive',
              title: 'Account exists',
              description: 'An account with this email already exists. Please sign in instead.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Sign up failed',
              description: error.message,
            });
          }
        } else {
          toast({
            title: 'Welcome!',
            description: 'Your account has been created successfully.',
          });
          navigate('/dashboard');
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Reset failed',
            description: error.message,
          });
        } else {
          setResetEmailSent(true);
          toast({
            title: 'Check your email',
            description: 'We sent you a password reset link.',
          });
        }
      } else if (mode === 'reset') {
        const { error } = await updatePassword(password);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Update failed',
            description: error.message,
          });
        } else {
          toast({
            title: 'Password updated!',
            description: 'Your password has been changed successfully.',
          });
          navigate('/dashboard');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast({
              variant: 'destructive',
              title: 'Invalid credentials',
              description: 'The email or password you entered is incorrect.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Sign in failed',
              description: error.message,
            });
          }
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create Account';
      case 'forgot': return 'Forgot Password';
      case 'reset': return 'Reset Password';
      default: return 'Welcome Back';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'signup': return 'Start preserving your precious memories';
      case 'forgot': return 'Enter your email to receive a reset link';
      case 'reset': return 'Enter your new password below';
      default: return 'Sign in to access your time capsules';
    }
  };

  const getButtonText = () => {
    if (loading) {
      switch (mode) {
        case 'signup': return 'Creating account...';
        case 'forgot': return 'Sending link...';
        case 'reset': return 'Updating password...';
        default: return 'Signing in...';
      }
    }
    switch (mode) {
      case 'signup': return 'Create Account';
      case 'forgot': return 'Send Reset Link';
      case 'reset': return 'Update Password';
      default: return 'Sign In';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'forgot':
      case 'reset':
        return <KeyRound className="w-8 h-8 text-accent" />;
      default:
        return <Gift className="w-8 h-8 text-accent" />;
    }
  };

  // Reset email sent confirmation screen
  if (mode === 'forgot' && resetEmailSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="p-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Check Your Email
            </h1>
            <p className="text-muted-foreground font-body mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <div className="glass-card p-6 rounded-2xl text-left space-y-3 mb-6">
              <p className="text-sm text-muted-foreground font-body">
                ✓ Check your inbox and spam folder
              </p>
              <p className="text-sm text-muted-foreground font-body">
                ✓ Click the link in the email to reset your password
              </p>
              <p className="text-sm text-muted-foreground font-body">
                ✓ The link expires in 24 hours
              </p>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => {
                setResetEmailSent(false);
                setMode('login');
              }}
            >
              Back to Sign In
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 mb-4">
              {getIcon()}
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              {getTitle()}
            </h1>
            <p className="text-muted-foreground font-body">
              {getDescription()}
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-label">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
              )}

              {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-label">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
              )}

              {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-label">
                    {mode === 'reset' ? 'New Password' : 'Password'}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
              )}

              {(mode === 'signup' || mode === 'reset') && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-label">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-sm text-accent hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                variant="peach"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {getButtonText()}
                  </>
                ) : (
                  getButtonText()
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              {mode === 'login' && (
                <p className="text-sm text-muted-foreground font-body">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-accent hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              )}
              {mode === 'signup' && (
                <p className="text-sm text-muted-foreground font-body">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-accent hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
              {(mode === 'forgot' || mode === 'reset') && (
                <p className="text-sm text-muted-foreground font-body">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-accent hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}