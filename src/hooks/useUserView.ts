import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

const useUserView = (fullName: string) => {
  const [view, setView] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async () => {
    try {
      const response = await fetch(`/api/addUser?full_name=${encodeURIComponent(fullName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user view');
      }
      const data = await response.json();
      setView(data.view);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [fullName]);

  useEffect(() => {
    if (fullName) {
      fetchUserRole();
    }
  }, [fullName, fetchUserRole]);

  useEffect(() => {
    if (!fullName) return;

    console.log('Setting up subscription for:', fullName);

    const channel = supabase
      .channel('user_view_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `full_name=eq.${fullName}` },
        (payload) => {
          console.log('Realtime update received:', payload);
          setView(payload.new.View); // Ensure this matches the field name in your database
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from:', fullName);
      supabase.removeChannel(channel);
    };
  }, [fullName]);

  return { view, loading };
};

export default useUserView;
