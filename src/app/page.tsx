"use client";

import { useState, useEffect } from 'react';
import { faker } from "@faker-js/faker";
import db from "@/modules/db";
import { revalidatePath } from "next/cache";
import Button from "@/components/Button";
import GoogleAuth from "@/components/GoogleAuth";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state

  
  // const generatePosts = async () => {
  //   await db.post.createMany({
  //     data: [
  //       { content: faker.lorem.sentence() },
  //       { content: faker.lorem.sentence() },
  //       { content: faker.lorem.sentence() },
  //     ],
  //   });
  //   fetchPosts(); // Re-fetch posts after generating new ones
  // };

  const handleLoginSuccess = (response: any) => {
    console.log('Login Success:', response);
    setIsAuthenticated(true); // Update authentication state
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
        'hello'
          {/* <Button onClick={generatePosts}>Generate Posts</Button>
          {posts.map((post: { id: string, content: string }) => (
            <div key={post.id}>{post.content}</div>
          ))} */}
        </>
      )}
    </main>
  );
}
