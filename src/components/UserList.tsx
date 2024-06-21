 "use client"
// import { FC } from 'react';
// import { db } from '@/db/index';
// import { usersTable, SelectUser } from '@/db/schema';

// const fetchUsers = async (): Promise<SelectUser[]> => {
//   const result = await db.select().from(usersTable).execute();
//   console.log(result);
//   return result;
// };

// const UserList: FC<{ users: SelectUser[] }> = ({ users }) => {
//   return (
//     <div>
//       <h2>User List</h2>
//       <ul>
//         {users.map(user => (
//           <li key={user.id}>
//             {user.name} - {user.email}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// const UserListContainer = async () => {
//   const users = await fetchUsers();
//   return <UserList users={users} />;
// };

// export default UserListContainer;

import { useEffect, useState } from 'react';
import { isAdmin } from '@/db/queries'; // Adjust the import path as needed

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data: User[] = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch users', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>User List</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} - {user.email} {isAdmin(user) && '(Admin)'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
