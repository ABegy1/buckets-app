// components/UserList.tsx
import { getUsers } from '@/drizzle/db';

export default async function UserList() {
  const users = await getUsers();

  return (
    <div>
      <h2>Users List</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <img src={user.image} alt={user.name} width={50} height={50} />
            <p>{user.name}</p>
            <p>{user.email}</p>
            <p>{new Date(user.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
