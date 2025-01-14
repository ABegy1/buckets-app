import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * useUserView Hook
 * 
 * This custom hook fetches and tracks the user's view (e.g., dashboard view or role-based page).
 * It also subscribes to real-time updates for the user's view changes from the database.
 * 
 * Key Features:
 * - Fetches the user's view from an API endpoint.
 * - Tracks the loading state to manage asynchronous operations.
 * - Subscribes to real-time updates for user view changes using Supabase's `channel`.
 * 
 * @param {string} fullName - The full name of the user whose view is being tracked.
 * @returns {Object} - An object containing:
 *   - `view`: The current view for the user.
 *   - `loading`: A boolean indicating whether the fetch operation is in progress.
 */
const useUserView = (fullName: string) => {
  // State to store the user's view (e.g., 'Standings', 'Admin')
  const [view, setView] = useState<string | null>(null);
  // State to track the loading status of the API fetch
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the user's view from the API.
   * 
   * This function makes an API call to fetch the user's view based on their full name.
   * It uses the `useCallback` hook to memoize the function, ensuring it only changes
   * when `fullName` changes.
   */
  const fetchUserRole = useCallback(async () => {
    try {
      // Fetch user view from the API
      const response = await fetch(`/api/addUser?full_name=${encodeURIComponent(fullName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user view'); // Throw error if API response is not OK
      }
      const data = await response.json();
      setView(data.view); // Set the fetched view in state
    } catch (error) {
      console.error(error); // Log any errors during the fetch
    } finally {
      setLoading(false); // Mark loading as complete
    }
  }, [fullName]);

  /**
   * Effect: Fetch user's view on component mount or when `fullName` changes.
   * 
   * Triggers the `fetchUserRole` function if `fullName` is provided.
   */
  useEffect(() => {
    if (fullName) {
      fetchUserRole();
    }
  }, [fullName, fetchUserRole]);

  /**
   * Effect: Set up a real-time subscription to track changes in the user's view.
   * 
   * Listens for `UPDATE` events in the `users` table and updates the view state when
   * a matching user (by full name) is updated.
   */
  useEffect(() => {
    if (!fullName) return; // Skip subscription if `fullName` is not provided

    console.log('Setting up subscription for:', fullName);

    // Create a Supabase channel for real-time updates
    const channel = supabase
      .channel('user_view_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `full_name=eq.${fullName}` },
        (payload) => {
          console.log('Realtime update received:', payload);
          setView(payload.new.View); // Update the view with the new value
        }
      )
      .subscribe();

    // Cleanup subscription on unmount or when `fullName` changes
    return () => {
      console.log('Unsubscribing from:', fullName);
      supabase.removeChannel(channel); // Remove the channel subscription
    };
  }, [fullName]);

  /**
   * Return the user's view and the loading status.
   */
  return { view, loading };
};

export default useUserView;
