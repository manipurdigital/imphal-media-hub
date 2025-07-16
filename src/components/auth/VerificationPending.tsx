import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';

const VerificationPending = () => {
  const [loading, setLoading] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const email = searchParams.get('email') || '';

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Email address not found. Please go back and try signing up again.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
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
        setResendCount(prev => prev + 1);
        toast({
          title: 'Email sent!',
          description: 'We\'ve sent another verification email to your inbox.',
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

  const handleBackToSignup = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We've sent a verification link to:
            <br />
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Click the link in the email to verify your account.</p>
            <p className="mt-2">
              Didn't receive the email? Check your spam folder or request a new one.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleResendVerification}
              variant="outline"
              className="w-full"
              disabled={loading || resendCount >= 3}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {resendCount === 0 ? 'Resend verification email' : `Resend email (${resendCount}/3)`}
                </>
              )}
            </Button>

            {resendCount >= 3 && (
              <p className="text-xs text-center text-muted-foreground">
                Maximum resend attempts reached. Please try again later or contact support.
              </p>
            )}

            <Button
              onClick={handleBackToSignup}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to signup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationPending;