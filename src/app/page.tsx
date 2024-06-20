'use client';
import React from 'react';
import { loginWithGoogle } from '../supabaseClient';

const Page = () => {
  const handleLogin = async () => {
    await loginWithGoogle();
  };

  return (
    <div>
      <h1>Page</h1>
      <button onClick={handleLogin}>Sign in with Google</button>
    </div>
  );
};

export default Page;
