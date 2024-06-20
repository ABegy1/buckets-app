'use client';
import React, { useEffect, useState } from 'react';
import { supabase, loginWithGoogle } from '../supabaseClient';

const Page = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleAuthRedirect = async () => {
      const { data, error } = await supabase.auth.getSessionFromUrl({
        storeSession: true,
      });

      if (data?.user) {
        setUser(data.user);
        // Clear the URL fragment
        window.history.replaceState(null, '', window.location.pathname);
      }

      if (error) {
        console.error('Error getting session from URL:', error.message);
      }
    };

    handleAuthRedirect();

    const session = supabase.auth.session();
    setUser(session?.user ?? null);

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleLogin = async () => {
    await loginWithGoogle();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div>
      <h1>Page</h1>
      <div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"
     data-callback="handleSignInWithGoogle">
</div>
<div className="g_id_signin"
     data-type="standard"></div>
    </div>
  );
};

export default Page;