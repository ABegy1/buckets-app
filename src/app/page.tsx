'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';
import AddUser from '@/components/AddDummyUser';

const Page = () => {
  const [user, setUser] = useState<User | null>(null);
  console.log(user?.user_metadata.full_name);

  useEffect(() => {
    // Function to check for the user session
    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getUserSession();

    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup the listener on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.log('Error signing in with Google:', error.message);
  };

 

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.log('Error signing out:', error.message);
  };


  return (
    <div className="App">
      <h1>Supabase Auth with Google</h1>
      
      {!user ? (
        <button onClick={signInWithGoogle}>Sign In with Google</button>
      ) : (
        <p>Welcome, {user.email}
       <AddUser name={user?.user_metadata.full_name} email={user.email} />
        <button onClick={signOut}>Sign Out</button>
        </p>
        

      )}
    </div>
  );
}
export default Page;