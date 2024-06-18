"use client";
import { useState } from 'react';

const AddDummyUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addUser = async () => {
    setLoading(true);
    setError(null);

    const dummyUser = {
      name: 'John Doe',
      age: 30,
      email: `johndoe${Math.floor(Math.random() * 10000)}@example.com`,
    };

    try {
      console.log('Sending user data:', dummyUser); // Add logging here
      const response = await fetch('/api/addUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dummyUser),
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
      // window.location.reload(); // Temporarily disable reload for debugging
    }
  };

  return (
    <div>
      <button onClick={addUser} disabled={loading}>
        {loading ? 'Adding...' : 'Add Dummy User'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AddDummyUser;
