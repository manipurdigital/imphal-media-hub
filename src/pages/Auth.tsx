import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'reset-password' ? 'reset-password' : tabParam === 'signin' ? 'login' : (tabParam || 'login'));
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Update active tab when URL parameters change
  useEffect(() => {
    const newTab = searchParams.get('tab');
    if (newTab === 'reset-password') {
      setActiveTab('reset-password');
    } else if (newTab === 'signup') {
      setActiveTab('signup');
    } else if (newTab === 'signin') {
      setActiveTab('login');
    } else {
      setActiveTab('login');
    }
  }, [searchParams]);

  // Redirect authenticated users to home (except when resetting password)
  useEffect(() => {
    if (user && !loading && activeTab !== 'reset-password') {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate, activeTab]);

  if (loading) {
    console.log('Auth: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('Auth: Rendering auth forms', { user, loading, activeTab });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Imoinu</h1>
          <p className="text-muted-foreground mt-2">Your premium streaming experience</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {activeTab === 'login' && 'Welcome Back'}
              {activeTab === 'signup' && 'Join Imoinu'}
              {activeTab === 'reset-password' && 'Reset Password'}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === 'login' && 'Sign in to your account to continue watching'}
              {activeTab === 'signup' && 'Create an account to start streaming'}
              {activeTab === 'reset-password' && 'Enter your new password below'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {activeTab !== 'reset-password' && (
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              )}
              
              <TabsContent value="login" className="mt-6">
                <LoginForm />
              </TabsContent>
              
              <TabsContent value="signup" className="mt-6">
                <SignupForm />
              </TabsContent>
              
              <TabsContent value="reset-password" className="mt-6">
                <ResetPasswordForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;