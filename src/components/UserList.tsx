"use client";

import { useEffect, useState, FormEvent } from 'react';
import { createUser } from '@/db/queries'; 
import { SelectUser } from '@/db/schema';

const UserList = () => {
  const [users, setUsers] = useState<SelectUser[]>([]);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const getUsers = async () => {
      const response = await fetch('/api/users');
      const usersList = await response.json();
      setUsers(usersList);
    };

    getUsers();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createUser({ name, age: parseInt(age), email });
    const response = await fetch('/api/users');
    const usersList = await response.json();
    setUsers(usersList);
    setName('');
    setAge('');
    setEmail('');
  };

  return (
    <div>
      <h2>User List</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.age}) - {user.email}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
        <input 
          type="number" 
          placeholder="Age" 
          value={age} 
          onChange={(e) => setAge(e.target.value)} 
          required 
        />
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <button type="submit">Add User</button>
      </form>
    </div>
  );
};

export default UserList;
