"use client";
import { useState, useEffect } from 'react';

interface AddUserProps {
  name: string;
  email?: string;
}

const AddUser = ({ name, email }: AddUserProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const addUser = async () => {
      setLoading(true);
      setError(null);

      const user = {
        name,
        email,
      };

      try {
        console.log('Sending user data:', user); // Add logging here
        const response = await fetch('/api/addUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user),
        });

        if (!response.ok) {
          const responseData = await response.json();
          throw new Error(responseData.error || 'Failed to add user');
        }

        console.log('User added successfully');
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          console.error('Error adding user:', err.message); // Add logging here
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    if (name && email) {
      addUser();
    }
  }, [name, email]);

  return (
    <div>
      {loading && <p>Adding user...</p>}
    </div>
  );
};

export default AddUser;
