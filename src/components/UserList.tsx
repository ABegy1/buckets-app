"use server"
import { FC } from 'react';
import { db } from '@/db/index';
import { usersTable, SelectUser } from '@/db/schema';

const fetchUsers = async (): Promise<SelectUser[]> => {
  const result = await db.select().from(usersTable).execute();
  console.log(result);
  return result;
};

const UserList: FC<{ users: SelectUser[] }> = ({ users }) => {
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

const UserListContainer = async () => {
  const users = await fetchUsers();
  return <UserList users={users} />;
};

export default UserListContainer;
