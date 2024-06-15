import { faker } from "@faker-js/faker";
import db from "@/modules/db";
import { revalidatePath } from "next/cache";
import Button from "@/components/Button";
import GoogleAuth from "@/components/GoogleAuth";
import { useState } from "react";

export default async function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const posts = await db.post.findMany({ orderBy: { createdAt: "desc" } });
  const generatePosts = async () => {
    "use server";

    await db.post.createMany({
      data: [
        { content: faker.lorem.sentence() },
        { content: faker.lorem.sentence() },
        { content: faker.lorem.sentence() },
      ],
    });
    revalidatePath("/");
  };
  const handleLoginSuccess = (response : any) => {
    console.log('Login Success:', response);
    setIsAuthenticated(true); // Update authentication state
    // handle successful login
  };

  const handleLoginFailure = (response : any) => {
    console.log('Login Failed:', response);
    // handle failed login
  };
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {!isAuthenticated ? (
        <GoogleAuth onSuccess={handleLoginSuccess} onFailure={handleLoginFailure} />
      ) : (
        <>
          <Button onClick={generatePosts}>Generate Posts</Button>
          {posts.map((post: any) => (
            <div key={post.id}>{post.content}</div>
          ))}
        </>
      )}
    </main>
  );
}
