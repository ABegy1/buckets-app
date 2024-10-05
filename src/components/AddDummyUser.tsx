"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

interface AddUserProps {
  name: string;
  email: string;
}

const AddUser = ({ name, email }: AddUserProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const addUserToSupabase = async () => {
      setLoading(true);
      setError(null);

      try {
        const { error: supabaseError } = await supabase
          .from('users') 
          .insert([{ name, email, role: 'User', View: 'Standings' }]); 
        if (supabaseError) {
          throw supabaseError;
        }

        console.log('User added successfully');
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          console.error('Error adding user:', err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    if (name && email) {
      addUserToSupabase();
    }
  }, [name, email]);

  return (
    <div>
      {loading && <p>Adding user...</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
};

export default AddUser;
