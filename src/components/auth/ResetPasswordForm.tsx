import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if user has a valid session for password reset
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          setSessionValid(false);
          return;
        }

        if (!session) {
          console.log('No session found');
          setSessionValid(false);
          return;
        }

        // Check if this is a recovery session
        const isRecoverySession = session.user?.aud === 'authenticated' && 
                                 (session.user?.recovery_sent_at || 
                                  session.user?.email_change_sent_at ||
                                  session.user?.app_metadata?.provider === 'recovery');
        
        console.log('Session check:', { 
          hasSession: !!session, 
          userAud: session.user?.aud,
          recoveryInfo: {
            recovery_sent_at: session.user?.recovery_sent_at,
            email_change_sent_at: session.user?.email_change_sent_at,
            provider: session.user?.app_metadata?.provider
          }
        });

        setSessionValid(true);
      } catch (error) {
        console.error('Unexpected error checking session:', error);
        setSessionValid(false);
      }
    };

    checkSession();
  }, []);

  // Show loading while checking session
  if (sessionValid === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Verifying reset link...</span>
      </div>
    );
  }

  // Show error if session is invalid
  if (!sessionValid) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your password reset link has expired or is invalid. Please request a new password reset.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => navigate('/auth?tab=login')}
          className="w-full"
        >
          Back to Sign In
        </Button>
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);

    try {
      console.log('Attempting password update...');
      
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        console.error('Password update error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to reset password.',
          variant: 'destructive',
        });
      } else {
        console.log('Password updated successfully');
        toast({
          title: 'Password updated!',
          description: 'Your password has been successfully updated.',
        });
        // Redirect to login after successful password reset
        navigate('/auth?tab=login', { replace: true });
      }
    } catch (error) {
      console.error('Unexpected error during password update:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your new password"
            className={errors.password ? 'border-red-500' : ''}
            {...register('password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your new password"
            className={errors.confirmPassword ? 'border-red-500' : ''}
            {...register('confirmPassword')}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating Password...
          </>
        ) : (
          'Update Password'
        )}
      </Button>

      <div className="text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate('/auth?tab=login')}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to Sign In
        </Button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;