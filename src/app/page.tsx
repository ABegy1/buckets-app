"use client";

import { useState } from 'react';
import GoogleAuth from "@/components/GoogleAuth";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state

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
       <div>'hello'</div>
      )}
    </main>
  );
}
