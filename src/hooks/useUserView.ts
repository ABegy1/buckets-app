import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * Tracks a user's preferred view from the profiles table.
 */
const useUserView = (profileId: string) => {
  const [view, setView] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async () => {
    if (!profileId) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('view_pref')
      .eq('id', profileId)
      .single();
    if (!error && data) {
      setView(data.view_pref);
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  useEffect(() => {
    if (!profileId) return;
    const channel = supabase
      .channel('user_view_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profileId}` },
        (payload) => {
          setView((payload.new as any).view_pref);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  return { view, loading };
};

export default useUserView;
