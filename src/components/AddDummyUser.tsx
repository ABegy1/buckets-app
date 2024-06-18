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
      const response = await fetch('/api/addUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dummyUser),
      });

      if (!response.ok) {
        throw new Error('Failed to add user');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
      window.location.reload(); // Reload to see the new user
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
