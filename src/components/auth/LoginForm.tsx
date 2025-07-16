import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [lastEmailSent, setLastEmailSent] = useState<string>('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const { toast } = useToast();

  // Add error boundary for auth context
  let signIn = async (emailOrProvider: string, password?: string) => ({ error: { message: 'Authentication not available' } });
  
  try {
    const auth = useAuth();
    signIn = auth.signIn;
    console.log('LoginForm: AuthProvider connected successfully');
  } catch (error) {
    console.log('LoginForm: AuthProvider not available, using fallback');
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    
    try {
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        // Handle specific error for unverified email
        if (error.message?.includes('email_not_confirmed') || error.message?.includes('Email not confirmed')) {
          setLastEmailSent(data.email);
          toast({
            title: 'Email not verified',
            description: 'Please check your email and click the verification link before signing in.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: error.message || 'Failed to sign in. Please check your credentials.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Success',
          description: 'Welcome back! You have been signed in.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signIn('google');
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to sign in with Google.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred with Google sign in.',
        variant: 'destructive',
      });
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!lastEmailSent) return;

    setResendingEmail(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: lastEmailSent,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to resend verification email.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email sent!',
          description: 'We\'ve sent a new verification email to your inbox.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setResendingEmail(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    setResetPasswordLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?tab=reset-password`
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to send reset password email.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Reset email sent!',
          description: 'Check your email for password reset instructions.',
        });
        setShowForgotPassword(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setResetPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGoogleSignIn}
        variant="outline"
        className="w-full"
        type="button"
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...register('email')}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            {...register('password')}
            className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing In...
          </>
        ) : (
          'Sign In'
        )}
      </Button>
      
      <div className="text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowForgotPassword(!showForgotPassword)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Forgot your password?
        </Button>
      </div>
    </form>

    {showForgotPassword && (
      <div className="mt-4 p-4 border rounded-lg bg-muted/50">
        <h3 className="text-sm font-medium mb-3">Reset Password</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const email = formData.get('resetEmail') as string;
            if (email) handleForgotPassword(email);
          }}
          className="space-y-3"
        >
          <Input
            name="resetEmail"
            type="email"
            placeholder="Enter your email"
            required
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={resetPasswordLoading}
              className="flex-1"
            >
              {resetPasswordLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForgotPassword(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    )}

    {lastEmailSent && (
      <div className="mt-4 p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground mb-3">
          Need to verify your email? We can send you a new verification link.
        </p>
        <Button
          onClick={handleResendVerificationEmail}
          variant="outline"
          size="sm"
          disabled={resendingEmail}
          className="w-full"
        >
          {resendingEmail ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Resend verification email
            </>
          )}
        </Button>
      </div>
    )}
    </div>
  );
};

export default LoginForm;