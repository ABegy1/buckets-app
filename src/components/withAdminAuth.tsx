'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

const useUserRole = (fullName: string) => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch(`/api/addUser?full_name=${encodeURIComponent(fullName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user role');
        }
        const data = await response.json();
        setRole(data.role);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [fullName]);

  return { role, loading };
};

type WithAdminAuthProps = {
  user: User | null;
  role: string | null;
};

const withAdminAuth = <P extends WithAdminAuthProps>(WrappedComponent: React.ComponentType<P>) => {
  const WithAdminAuth = (props: Omit<P, keyof WithAdminAuthProps>) => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const { role, loading } = useUserRole(user?.user_metadata.full_name ?? '');

    useEffect(() => {
      const getUserSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      };

      getUserSession();

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }, []);

    useEffect(() => {
      if (!loading && role && role !== 'Admin') {
        router.push('/');
      }
    }, [role, loading, router]);

    if (loading || !user) {
      return <div>Loading...</div>;
    }

    return <WrappedComponent {...(props as P)} user={user} role={role} />;
  };

  WithAdminAuth.displayName = `WithAdminAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAdminAuth;
};

export default withAdminAuth;
