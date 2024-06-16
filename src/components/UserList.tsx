"use client";
import { useState, useEffect } from 'react';
import { getUsers } from '@/db/db';
import { SelectUser } from '@/db/schema';

const UserList = () => {
  const [users, setUsers] = useState<SelectUser[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersList = await getUsers();
      setUsers(usersList);
    };
    fetchUsers();
  }, []);

  return (
    <div>
      <h2>User List</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.age} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
