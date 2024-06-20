'use client';
import React from 'react';
import { useAuth } from '../components/useAuth'; // Adjust the path as needed

interface User {
  email: string;
}

const Page = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>You need to be logged in to access this page.</div>;
  }

  return <div>Welcome, {(user as User).email}</div>;
};

export default Page;