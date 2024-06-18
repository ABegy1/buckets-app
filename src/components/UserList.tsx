// src/components/UserList.tsx
import { useEffect, useState } from 'react';
import { SelectUser } from '@/db/schema';

const UserList = ({ initialUsers }: { initialUsers: SelectUser[] }) => {
  const [users, setUsers] = useState<SelectUser[]>(initialUsers);

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
    </div>
  );
};

export default UserList;
