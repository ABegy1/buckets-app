import React from 'react';
import { supabase } from './supabaseClient';

const Login = () => {
  const handleGoogleLogin = async () => {
    const { user, session, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) {
      console.error('Error logging in with Google:', error);
    } else {
      console.log('User:', user);
      console.log('Session:', session);
    }
  };

  return (
    <div>
      <button onClick={handleGoogleLogin}>Login with Google</button>
    </div>
  );
};

export default Login;