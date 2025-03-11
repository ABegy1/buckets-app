'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient'; 
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Box, Typography, Stack, Button, TextField, CircularProgress, Alert, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const HomePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch user session and listen for auth changes
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchSession();
    return () => authListener.subscription.unsubscribe();
  }, []);

  // Handle user check and redirection
  useEffect(() => {
    if (!user) return;

    const checkAndRedirect = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .single();

        if (error && error.code !== 'PGRST116') {
          setError(error.message);
          return;
        }

        const userRole = data?.role ?? 'User';

        if (!data) {
          await supabase.from('users').insert([{ 
            name: username || 'default', 
            email: user.email, 
            role: 'User', 
            View: 'Standings' 
          }]);
        }

        router.replace(userRole === 'Admin' ? '/Admin' : '/Standings');
      } catch (err) {
        console.error('Error checking user:', err);
        setError('Failed to check user role.');
      }
    };

    checkAndRedirect();
  }, [user, router, username]);

  // Sign in with email/password
  const handleAuth = async () => {
    setIsProcessing(true);
    setError(null);
  
    try {
      let response;
      
      if (isSignUpMode) {
        response = await supabase.auth.signUp({ email, password });
      } else {
        response = await supabase.auth.signInWithPassword({ email, password });
      }
  
      const { data, error } = response;
  
      if (error) {
        setError(error.message);
      } else {
        setUser(data.user);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setError(error.message);
  };

  return (
    <Box sx={{ width: 400, mx: 'auto', mt: 10, p: 4, borderRadius: 3, boxShadow: 3, bgcolor: 'background.paper' }}>
      <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
        {isSignUpMode ? 'Create an account' : 'Welcome back'}
      </Typography>
      <Typography variant="body2" color="textSecondary" textAlign="center" gutterBottom>
        {isSignUpMode ? 'Please enter your details to sign up.' : 'Please enter your details to sign in.'}
      </Typography>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
        <Button fullWidth variant="outlined" startIcon={<GoogleIcon />} onClick={signInWithGoogle}>
          Sign in with Google
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }}>OR</Divider>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault(); // Prevents form submission from reloading the page
            handleAuth();
          }
        }}
      >
        {isSignUpMode && (
          <TextField label="Username" fullWidth margin="dense" value={username} onChange={(e) => setUsername(e.target.value)} />
        )}
        <TextField label="E-Mail Address" type="email" fullWidth margin="dense" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Password" type="password" fullWidth margin="dense" value={password} onChange={(e) => setPassword(e.target.value)} />

        <Button fullWidth variant="contained" color="primary" sx={{ mt: 2, py: 1.5 }} onClick={handleAuth} disabled={isProcessing}>
          {isProcessing ? <CircularProgress size={24} /> : isSignUpMode ? 'Sign up' : 'Sign in'}
        </Button>
      </form>

      <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
        {isSignUpMode ? 'Already have an account?' : 'Don’t have an account yet?'} 
        <Button variant="text" onClick={() => setIsSignUpMode(!isSignUpMode)}>
          {isSignUpMode ? 'Sign in' : 'Sign up'}
        </Button>
      </Typography>
    </Box>
  );
};

export default HomePage;
