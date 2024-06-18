"use client";
import { useState } from 'react';
import GoogleAuth from "@/components/GoogleAuth";
import UserList from '@/components/UserList';
import { db } from '@/db/index';

import { SelectUser, usersTable } from '@/db/schema';

export default function Home({ initialUsers }: { initialUsers: SelectUser[] }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = (response: any) => {
    console.log('Login Success:', response);
    setIsAuthenticated(true);
  };

  const handleLoginFailure = (response: any) => {
    console.log('Login Failed:', response);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {!isAuthenticated ? (
        <GoogleAuth onSuccess={handleLoginSuccess} onFailure={handleLoginFailure} />
      ) : (
        <>
          <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
            Get started by editing&nbsp;
            <code className="font-mono font-bold">src/app/page.tsx</code>
          </p>
          <UserList initialUsers={initialUsers} />
        </>
      )}
    </main>
  );
}

export async function getServerSideProps() {
  const result = await db.select().from(usersTable).execute();
  return {
    props: {
      initialUsers: result,
    },
  };
}